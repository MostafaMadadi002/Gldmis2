import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Grid, 
  List, 
  Users as UsersIcon, 
  X, 
  Camera, 
  Phone, 
  MapPin, 
  UserCircle, 
  ShieldCheck, 
  Lock,
  Trash2,
  Edit
} from 'lucide-react';
import api from '../lib/api';
import { User } from '../types';
import { useSettings } from '../context/SettingsContext';

const UserAvatar: React.FC<{ src?: string, alt: string, className?: string }> = ({ src, alt, className }) => {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-kh-bg text-kh-text/20 ${className}`}>
        <UserCircle size={className?.includes('w-10') ? 20 : 40} />
      </div>
    );
  }
  // Check if it's a full URL or relative
  const avatarUrl = src.startsWith('http') ? src : `${api.defaults.baseURL?.replace('/api', '')}${src}`;
  return <img src={avatarUrl} alt={alt} className={className} />;
};

const Users: React.FC = () => {
  const { t, language } = useSettings();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRtl = language !== 'en';
  const currentUser = JSON.parse(localStorage.getItem('khazana_user') || '{}');
  
  const initialFormState = {
    firstName: '',
    lastName: '',
    fatherName: '',
    phone: '',
    address: '',
    role: 'seller' as 'admin' | 'seller',
    username: '',
    password: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/');
      const mappedUsers = response.data.map((u: any) => ({
        id: u.id.toString(),
        firstName: u.first_name,
        lastName: u.last_name,
        fatherName: u.father_name,
        phone: u.phone,
        address: u.address,
        role: u.role,
        username: u.username,
        image: u.image,
        createdAt: u.created_at,
        isSuperuser: u.is_superuser // We might need this to prevent deletion
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setSelectedImage(null);
    setImageFile(null);
    setEditingUserId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      fatherName: user.fatherName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      username: user.username,
      password: '', // Don't show password, leave empty if not changing
    });
    setSelectedImage(user.image || null);
    setImageFile(null);
    setEditingUserId(user.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = new FormData();
      payload.append('first_name', formData.firstName);
      payload.append('last_name', formData.lastName);
      payload.append('father_name', formData.fatherName);
      payload.append('phone', formData.phone);
      payload.append('address', formData.address);
      payload.append('role', formData.role);
      payload.append('username', formData.username);
      
      if (formData.password) {
        payload.append('password', formData.password);
      }
      
      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (editingUserId) {
        await api.put(`/users/${editingUserId}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/users/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      fetchUsers();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Failed to save user:', error);
      alert(t('error_saving_sale') + ': ' + JSON.stringify(error.response?.data || error.message));
    }
  };

  const handleDelete = async (userToDelete: any) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await api.delete(`/users/${userToDelete.id}/`);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.detail || t('error_saving_sale'));
    }
  };

  const filteredUsers = users.filter(user => 
    !user.isSuperuser && (
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
    )
  );

  const canDeleteUser = (user: any) => {
    // Current user can't delete themselves
    if (user.id === currentUser.id) return false;
    
    // Superuser can be deleted by no one (handled in backend but good to hide in UI)
    if (user.isSuperuser) return false;

    // Managers (admin role) can't delete other Managers if they are not superusers
    if (!currentUser.is_superuser && user.role === 'admin') return false;

    return true;
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'font-rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
          <h2 className="text-xl font-bold text-kh-text flex items-center gap-2">
            <UsersIcon className="text-kh-gold" size={24} />
            {t('user_management')}
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={openAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-kh-card text-kh-text px-4 h-10 rounded-lg text-sm font-medium hover:bg-kh-card/90 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="leading-none mb-0.5">{t('add_user')}</span>
            </button>
            <div className="flex items-center bg-white dark:bg-dark-card border border-kh-card/10 rounded-lg p-1 shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-kh-card text-kh-text' : 'text-kh-text/40 hover:text-kh-text'}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-kh-card text-kh-text' : 'text-kh-text/40 hover:text-kh-text'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={t('search')}
              className={`w-full bg-white dark:bg-dark-card border border-kh-card/10 rounded-lg py-2.5 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-kh-card/20 transition-all text-kh-text shadow-sm`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-kh-text/40`} size={18} />
          </div>
          <button className="bg-kh-card text-kh-text p-2.5 sm:px-6 sm:py-2.5 rounded-lg text-sm font-medium hover:bg-kh-card/90 transition-colors shadow-sm flex items-center justify-center">
            <Search size={18} className="sm:hidden" />
            <span className="hidden sm:inline">{t('search')}</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-kh-card/5 w-full"></div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-kh-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-kh-muted font-bold">{t('loading_users')}</p>
        </div>
      ) : filteredUsers.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white border border-kh-card/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-kh-bg shadow-sm">
                    <UserAvatar src={user.image} alt={user.firstName} className="w-full h-full object-cover" />
                  </div>
                  <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg shadow-sm border border-white ${user.role === 'admin' ? 'bg-kh-gold text-black' : 'bg-kh-card text-kh-text'}`}>
                    <ShieldCheck size={14} />
                  </div>
                </div>

                <h4 className="font-bold text-kh-text text-lg">{user.firstName} {user.lastName}</h4>
                <p className="text-xs text-kh-muted font-medium mb-4">{t('father_name')}: {user.fatherName}</p>

                <div className="w-full space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-kh-text font-medium bg-kh-bg/50 p-2 rounded-lg">
                    <Phone size={14} className="text-kh-gold" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-kh-text font-medium bg-kh-bg/50 p-2 rounded-lg">
                    <UserCircle size={14} className="text-kh-gold" />
                    <span className="ltr">@{user.username}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2 w-full pt-4 border-t border-kh-card/5">
                  {canDeleteUser(user) && (
                    <button 
                      onClick={() => handleDelete(user)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-xs font-bold"
                    >
                      <Trash2 size={14} />
                      {t('delete')}
                    </button>
                  )}
                  <button 
                    onClick={() => openEditModal(user)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-kh-text/40 hover:bg-kh-card/5 rounded-xl transition-colors text-xs font-bold"
                  >
                    <Edit size={14} />
                    {t('edit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-card border border-kh-card/5 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} text-sm min-w-[700px]`}>
                <thead>
                  <tr className="bg-kh-card/5 text-kh-text border-b border-kh-card/5">
                    <th className="px-6 py-4 font-bold">{t('users')}</th>
                    <th className="px-6 py-4 font-bold">{t('father_name')}</th>
                    <th className="px-6 py-4 font-bold">{t('username')}</th>
                    <th className="px-6 py-4 font-bold">{t('phone')}</th>
                    <th className="px-6 py-4 font-bold text-center">{t('access_type')}</th>
                    <th className={`px-6 py-4 font-bold ${isRtl ? 'text-left' : 'text-right'}`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kh-card/5">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-kh-bg/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-kh-card/10 shrink-0">
                            <UserAvatar src={user.image} alt={user.firstName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-kh-text">{user.firstName} {user.lastName}</div>
                            <div className="text-[10px] text-kh-muted mt-0.5">{user.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-kh-text">{user.fatherName}</td>
                      <td className="px-6 py-4">
                        <span className="text-kh-text font-medium ltr">@{user.username}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-kh-text">{user.phone}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${
                          user.role === 'admin' 
                            ? 'bg-kh-gold/10 text-kh-gold border-kh-gold/20' 
                            : 'bg-kh-card/10 text-kh-text border-kh-card/20'
                        }`}>
                          <ShieldCheck size={12} />
                          {user.role === 'admin' ? t('seller_full_access') : t('seller_limited_access')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-2 text-kh-text/40 hover:text-kh-text hover:bg-kh-card/5 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          {canDeleteUser(user) && (
                            <button 
                              onClick={() => handleDelete(user)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-dark-card border border-kh-card/5 rounded-2xl p-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-kh-bg dark:bg-black/20 rounded-full flex items-center justify-center text-kh-text/20">
            <UsersIcon size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-kh-text">{t('no_user_found')}</h3>
            <p className="text-sm text-kh-text/40">{t('user_add_hint')}</p>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${isRtl ? 'font-rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-kh-card/5 flex justify-between items-center bg-kh-card text-kh-text">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  {editingUserId ? <Edit size={20} className="text-kh-gold" /> : <Plus size={20} className="text-kh-gold" />}
                </div>
                <h3 className="text-xl font-bold">{editingUserId ? t('edit_user_title') : t('add_user_title')}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-kh-text/60 hover:text-kh-text transition-colors bg-white/5 p-2 rounded-xl">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left: Avatar Selection */}
                  <div className="flex flex-col items-center gap-4">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-3xl border-2 border-dashed border-kh-card/10 flex flex-col items-center justify-center text-kh-text/40 hover:border-kh-gold hover:text-kh-gold transition-all cursor-pointer bg-kh-bg/30 relative overflow-hidden group shadow-inner"
                    >
                      {selectedImage ? (
                        <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera size={32} />
                          <span className="text-[10px] mt-2 font-bold">انتخاب تصویر</span>
                        </>
                      )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-kh-text">
                        <Edit size={24} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-kh-text/40">{t('profile_image')}</p>
                    </div>
                  </div>

                  {/* Right: Form Fields */}
                  <div className="flex-1 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-kh-text/60 pr-1 flex items-center gap-1">
                          <UserCircle size={12} className="text-kh-gold" />
                          {t('first_name')}
                        </label>
                        <input 
                          required
                          name="firstName"
                          type="text" 
                          placeholder={t('first_name')}
                          className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-kh-text/60 pr-1 flex items-center gap-1">
                          {t('last_name')}
                        </label>
                        <input 
                          required
                          name="lastName"
                          type="text" 
                          placeholder={t('last_name')}
                          className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-kh-text/60 pr-1">{t('father_name')}</label>
                        <input 
                          required
                          name="fatherName"
                          type="text" 
                          placeholder={t('father_name')}
                          className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all"
                          value={formData.fatherName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-kh-text/60 pr-1 flex items-center gap-1">
                          <Phone size={12} className="text-kh-gold" />
                          {t('phone')}
                        </label>
                        <input 
                          required
                          name="phone"
                          type="tel" 
                          placeholder="07XXXXXXXX"
                          className={`w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all ltr ${isRtl ? 'text-right' : 'text-left'}`}
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-kh-text/60 pr-1 flex items-center gap-1">
                        <MapPin size={12} className="text-kh-gold" />
                        {t('address')}
                      </label>
                      <textarea 
                        name="address"
                        rows={2}
                        placeholder={t('address')}
                        className="w-full bg-kh-bg/50 dark:bg-black/10 border border-kh-card/10 dark:border-dark-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all resize-none"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="p-4 bg-kh-bg/30 dark:bg-black/20 rounded-2xl border border-kh-card/5 dark:border-dark-border space-y-5">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={16} className="text-kh-gold" />
                        <h4 className="text-xs font-black text-kh-text">{t('security_settings')}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-kh-text/60 pr-1">{t('access_type')}</label>
                          <select 
                            name="role"
                            className="w-full bg-white dark:bg-dark-card border border-kh-card/10 dark:border-dark-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all font-bold"
                            value={formData.role}
                            onChange={handleInputChange}
                          >
                            <option value="seller">{t('seller_limited_access')}</option>
                            <option value="admin">{t('seller_full_access')}</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-kh-text/60 pr-1">{t('username')}</label>
                          <input 
                            required
                            name="username"
                            type="text" 
                            placeholder={t('username_placeholder')}
                            className={`w-full bg-white dark:bg-dark-card border border-kh-card/10 dark:border-dark-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all ltr ${isRtl ? 'text-right' : 'text-left'}`}
                            value={formData.username}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-kh-text/60 pr-1 flex items-center gap-1">
                          <Lock size={12} className="text-kh-gold" />
                          {t('temp_password')}
                        </label>
                        <input 
                          required={!editingUserId}
                          name="password"
                          type="password" 
                          placeholder="********"
                          className={`w-full bg-white dark:bg-dark-card border border-kh-card/10 dark:border-dark-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-kh-gold/20 text-kh-text dark:text-dark-text transition-all ltr ${isRtl ? 'text-right' : 'text-left'}`}
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-kh-card/5 bg-kh-bg/30 dark:bg-black/10 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3.5 border border-kh-card/10 dark:border-dark-border rounded-2xl text-sm font-black text-kh-text dark:text-dark-text hover:bg-kh-card/5 transition-all"
                >
                  {t('cancel_btn')}
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-6 py-3.5 bg-kh-card dark:bg-kh-gold text-kh-text dark:text-black rounded-2xl text-sm font-black hover:bg-kh-card/90 shadow-xl shadow-kh-gold/20 transition-all active:scale-[0.98]"
                >
                  {editingUserId ? t('update_info') : t('create_account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
