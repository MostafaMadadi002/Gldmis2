from rest_framework import serializers
from django.db import transaction
from .models import Sale, SaleItem, Expense
from inventory.models import Product

class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'name_snapshot', 'code_snapshot', 'material_snapshot',
            'carat_snapshot', 'stone_snapshot', 'weight', 'quantity', 'price',
            'rate_at_sale', 'purchase_price_snapshot'
        ]
        read_only_fields = [
            'id', 'name_snapshot', 'code_snapshot', 'material_snapshot',
            'carat_snapshot', 'stone_snapshot', 'purchase_price_snapshot'
        ]

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    seller_name = serializers.ReadOnlyField(source='seller.username')

    class Meta:
        model = Sale
        fields = ['id', 'invoice_number', 'customer_name', 'seller', 'seller_name', 'total_amount', 'created_at', 'items']
        read_only_fields = ['invoice_number', 'seller', 'total_amount', 'created_at']

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context.get('request')
        
        product_ids = [i["product"].id for i in items_data]
        # Locking products for concurrent safety
        locked_products = {p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)}

        total = 0
        prepared_items = []
        
        to_delete_ids = []
        for item_data in items_data:
            product = locked_products[item_data["product"].id]
            qty = item_data["quantity"]
            
            if product.quantity < qty:
                raise serializers.ValidationError(
                    f"موجودی کافی برای «{product.name}» نیست (موجودی: {product.quantity}، درخواست: {qty})."
                )
            
            product.quantity -= qty
            product.save(update_fields=["quantity"])
            
            if (product.quantity <= 0):
                to_delete_ids.append(product.id)
            
            total += item_data["price"] * qty
            prepared_items.append({
                'product': product,
                'data': item_data
            })

        sale = Sale.objects.create(
            seller=request.user,
            customer_name=validated_data.get("customer_name", ""),
            total_amount=total
        )

        for item in prepared_items:
            p = item['product']
            d = item['data']
            SaleItem.objects.create(
                sale=sale,
                product_id=p.id, # Link by ID to avoid instance state issues
                name_snapshot=p.name,
                code_snapshot=p.code,
                material_snapshot=p.material,
                carat_snapshot=p.carat,
                stone_snapshot=d.get("stone_override") or p.stone_type,
                weight=d["weight"],
                quantity=d["quantity"],
                price=d["price"],
                rate_at_sale=d.get("rate_at_sale"),
                purchase_price_snapshot=p.purchase_price or 0
            )
        
        # Finally delete products that reached zero
        if to_delete_ids:
            Product.objects.filter(id__in=to_delete_ids).delete()
            
        return sale


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'category', 'amount', 'recipient', 'description', 
            'date', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)

