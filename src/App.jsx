import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { 
  ShieldCheck, Mail, Users, Cctv, Plus, Copy, Trash2, RefreshCw, Menu, X, 
  CheckCircle, Send, Key, Phone, Search, Link as LinkIcon, Calendar, Lock, 
  Server, AtSign, Settings, Database, UploadCloud, AlertCircle, QrCode,
  Edit3, Save, Sparkles, Clock, RotateCcw
} from 'lucide-react';

// URL permanente conectada a tu nuevo Google Sheets
const DEFAULT_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwarMdnRESrCGx5JimRqceuJVi--01rGSQgW6RlNwC89g6Q5iybgMFFme1we-XMZNGqrg/exec"; 

// Función segura para evitar que valores vacíos o numéricos de Google Sheets rompan la página
const safeStr = (val) => (val !== null && val !== undefined ? String(val) : '');

// Icono SVG nativo para Editar (evita errores de versión en librerías externas)
const EditIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

// Barra de Autocompletado Inteligente que cruza datos entre Correos, CCTV y Equipos IP
const SmartAutocomplete = ({ profiles, queryValues, onSelect, accent = "blue" }) => {
  const matches = useMemo(() => {
    const terms = (queryValues || [])
      .map(v => safeStr(v).trim().toLowerCase())
      .filter(v => v.length >= 2);
    if (terms.length === 0 || !Array.isArray(profiles)) return [];

    return profiles.filter(p => {
      const haystack = `${p.clientName} ${p.phone} ${p.email} ${p.appUser} ${p.ip}`.toLowerCase();
      return terms.some(t => haystack.includes(t));
    }).slice(0, 4);
  }, [profiles, queryValues]);

  if (matches.length === 0) return null;

  return (
    <div className="mb-5 p-3.5 bg-slate-950/90 border border-blue-500/30 rounded-xl shadow-lg">
      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
        <Users size={13} /> Autocompletado Inteligente (Clientes detectados en tu bóveda - Clic para rellenar)
      </div>
      <div className="flex flex-wrap gap-2">
        {matches.map((m, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(m)}
            className="px-3 py-2 bg-slate-900 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 rounded-lg text-left transition-all flex items-center gap-2.5 group"
          >
            <div className="flex flex-col">
              <span className="text-xs font-black text-white group-hover:text-blue-300">
                {m.clientName || m.email || 'Cliente Registrado'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {[m.phone && `Tel: ${m.phone}`, m.email && `Correo: ${m.email}`, m.ip && `IP: ${m.ip}`].filter(Boolean).join(' • ')}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const DataRow = memo(({ value, icon: IconCmp, onCopy, label, color = "blue" }) => {
  const displayVal = safeStr(value);
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 mb-2.5 hover:border-slate-700 transition-colors shadow-sm">
      <div className="flex flex-col min-w-0 flex-1">
        {label && (
          <span className={`text-[10px] font-black text-${color}-400 uppercase tracking-widest mb-1 flex items-center gap-1.5`}>
            {IconCmp && <IconCmp size={13} className="shrink-0" />} {label}
          </span>
        )}
        <span className="text-sm font-bold text-slate-100 truncate tracking-wide font-mono bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800/80 select-all">
          {displayVal || '---'}
        </span>
      </div>
      <button 
        type="button" 
        onClick={(e) => { e.preventDefault(); onCopy(displayVal); }} 
        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-blue-500 shrink-0 shadow-md active:scale-95"
        title="Copiar dato"
      >
        <Copy size={15} />
        <span className="text-[11px] font-black uppercase tracking-wider">Copiar</span>
      </button>
    </div>
  );
});

// ============================================================================
// MÓDULO 1: BANCO DE CORREOS (GMAIL, HOTMAIL, ETC.)
// ============================================================================
const EmailsModule = ({ data, allProfiles, onSave, onUpdate, onDelete, onCopy, showToast }) => {
  const [form, setForm] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('kgb_draft_emails');
      return savedDraft ? JSON.parse(savedDraft) : { platform: 'Gmail', email: '', password: '', tags: '' };
    } catch {
      return { platform: 'Gmail', email: '', password: '', tags: '' };
    }
  });
  const [editingItem, setEditingItem] = useState(null);
  const [lastAutoSavedStr, setLastAutoSavedStr] = useState('');
  const [search, setSearch] = useState('');

  // Guardar borrador automáticamente mientras escribe
  useEffect(() => {
    try { localStorage.setItem('kgb_draft_emails', JSON.stringify(form)); } catch {}
  }, [form]);

  // Autoguardado cada 1 minuto (60,000 ms) si hay correo y clave escritos
  useEffect(() => {
    const timer = setInterval(() => {
      const emailTrim = safeStr(form.email).trim();
      const passTrim = safeStr(form.password).trim();
      if (!emailTrim || !passTrim) return;

      const snapshot = JSON.stringify(form);
      if (snapshot === lastAutoSavedStr) return;

      const rowValues = [form.platform || 'Gmail', emailTrim, passTrim, safeStr(form.tags).trim()];
      if (editingItem) {
        onUpdate('personal', editingItem.id, 'Correos', editingItem.email, rowValues, form, true);
      } else {
        const created = onSave('personal', 'Correos', rowValues, form, true);
        if (created) setEditingItem(created);
      }
      setLastAutoSavedStr(snapshot);
    }, 60000);
    return () => clearInterval(timer);
  }, [form, editingItem, lastAutoSavedStr, onSave, onUpdate]);
  
  const filteredData = useMemo(() => {
    const q = safeStr(search).toLowerCase();
    return (Array.isArray(data) ? data : []).filter(item => 
      safeStr(item.email).toLowerCase().includes(q) || 
      safeStr(item.tags).toLowerCase().includes(q) ||
      safeStr(item.platform).toLowerCase().includes(q)
    );
  }, [data, search]);

  const resetForm = () => {
    const empty = { platform: 'Gmail', email: '', password: '', tags: '' };
    setForm(empty);
    setEditingItem(null);
    setLastAutoSavedStr('');
    try { localStorage.removeItem('kgb_draft_emails'); } catch {}
  };

  const handleSubmit = () => {
    if (!safeStr(form.email).trim() || !safeStr(form.password).trim()) {
      return showToast("Correo y contraseña son obligatorios");
    }
    const rowValues = [form.platform, safeStr(form.email).trim(), safeStr(form.password).trim(), safeStr(form.tags).trim()];
    if (editingItem) {
      onUpdate('personal', editingItem.id, 'Correos', editingItem.email, rowValues, form, false);
    } else {
      onSave('personal', 'Correos', rowValues, form, false);
    }
    resetForm();
  };

  const startEdit = (item) => {
    const loaded = {
      platform: safeStr(item.platform) || 'Gmail',
      email: safeStr(item.email),
      password: safeStr(item.password),
      tags: safeStr(item.tags)
    };
    setEditingItem(item);
    setForm(loaded);
    setLastAutoSavedStr(JSON.stringify(loaded));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Modo edición activado");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className={`bg-slate-900 border ${editingItem ? 'border-amber-500/70' : 'border-slate-800'} p-6 sm:p-8 rounded-2xl shadow-xl transition-all`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20"><Mail size={24} /></div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tight">
                {editingItem ? 'Editando Correo Registrado' : 'Banco de Correos'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Guarda cuentas de Gmail, Hotmail y otros • Autoguardado activo cada 1 min.</p>
            </div>
          </div>
          {editingItem && (
            <button type="button" onClick={resetForm} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/30">
              <X size={14} /> Cancelar Edición
            </button>
          )}
        </div>

        <SmartAutocomplete 
          profiles={allProfiles} 
          queryValues={[form.tags, form.email]} 
          onSelect={(p) => setForm(prev => ({
            ...prev,
            email: prev.email || p.email || p.appUser || '',
            password: prev.password || p.emailPass || p.appPass || '',
            tags: p.clientName ? `${p.clientName}${p.phone ? ' - ' + p.phone : ''}` : prev.tags
          }))} 
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-slate-950/60 p-5 sm:p-6 rounded-xl border border-slate-800/70">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plataforma</label>
            <select className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.platform} onChange={e=>setForm({...form, platform: e.target.value})}>
              <option value="Gmail">Gmail</option>
              <option value="Hotmail / Outlook">Hotmail / Outlook</option>
              <option value="Yahoo">Yahoo</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario / Correo</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="ejemplo@gmail.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Clave del correo" />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente Asignado / Teléfono / Nota (Opcional)</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.tags} onChange={e=>setForm({...form, tags: e.target.value})} placeholder="Escribe nombre o teléfono para autocompletar..." />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={handleSubmit} className={`w-full py-3 ${editingItem ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2`}>
              <Plus size={18}/> {editingItem ? 'Actualizar Correo' : 'Guardar Correo'}
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
        <input type="text" placeholder="Buscar por correo, plataforma o cliente asignado..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredData.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col shadow-xl">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Mail size={16}/></div>
                <span className="text-xs font-black text-white uppercase tracking-wider">{safeStr(item.platform) || 'Gmail'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => startEdit(item)} className="text-amber-400 hover:text-white bg-slate-900 hover:bg-amber-600 px-2.5 py-1.5 rounded-lg transition-all border border-slate-800 flex items-center gap-1 text-[10px] font-black uppercase" title="Editar correo">
                  <EditIcon size={13} /> Editar
                </button>
                <button type="button" onClick={() => onDelete('personal', item.id, 'Correos', item.email)} className="text-slate-500 hover:text-rose-500 bg-slate-900 hover:bg-rose-500/10 p-2 rounded-lg transition-all border border-slate-800" title="Eliminar correo">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <DataRow value={item.email} icon={AtSign} label="Correo Electrónico" color="blue" onCopy={onCopy} />
              <DataRow value={item.password} icon={Lock} label="Contraseña" color="blue" onCopy={onCopy} />
              
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Users size={14} className="text-slate-400 shrink-0"/>
                  <span className="text-xs text-slate-300 font-bold truncate">
                    {safeStr(item.tags) ? safeStr(item.tags) : <span className="text-emerald-400">Disponible / Sin asignar</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold bg-slate-900/40 rounded-2xl border border-slate-800/60">
            No hay correos registrados todavía.
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MÓDULO 2: CLIENTES CCTV (DVR, HIK-CONNECT, HILOOK, CIFRADO)
// ============================================================================
const CCTVModule = ({ data, allProfiles, onSave, onUpdate, onDelete, onCopy, showToast }) => {
  const [form, setForm] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('kgb_draft_cctv');
      return savedDraft ? JSON.parse(savedDraft) : { clientName: '', appUser: '', appPass: '', encryptCode: '', dvrUser: 'admin', dvrPass: '', phone: '' };
    } catch {
      return { clientName: '', appUser: '', appPass: '', encryptCode: '', dvrUser: 'admin', dvrPass: '', phone: '' };
    }
  });
  const [editingItem, setEditingItem] = useState(null);
  const [lastAutoSavedStr, setLastAutoSavedStr] = useState('');
  const [search, setSearch] = useState('');

  // Guardar borrador local mientras se llena el formulario
  useEffect(() => {
    try { localStorage.setItem('kgb_draft_cctv', JSON.stringify(form)); } catch {}
  }, [form]);

  // Autoguardado cada 1 minuto (60,000 ms)
  useEffect(() => {
    const timer = setInterval(() => {
      const nameTrim = safeStr(form.clientName).trim();
      if (!nameTrim) return;

      const snapshot = JSON.stringify(form);
      if (snapshot === lastAutoSavedStr) return;

      const rowValues = [
        nameTrim,
        safeStr(form.appUser).trim(),
        safeStr(form.appPass).trim(),
        safeStr(form.encryptCode).trim(),
        safeStr(form.dvrUser).trim() || 'admin',
        safeStr(form.dvrPass).trim(),
        safeStr(form.phone).trim()
      ];

      if (editingItem) {
        onUpdate('clients', editingItem.id, 'CCTV', editingItem.clientName, rowValues, form, true);
      } else {
        const created = onSave('clients', 'CCTV', rowValues, form, true);
        if (created) setEditingItem(created);
      }
      setLastAutoSavedStr(snapshot);
    }, 60000);
    return () => clearInterval(timer);
  }, [form, editingItem, lastAutoSavedStr, onSave, onUpdate]);

  const filteredData = useMemo(() => {
    const q = safeStr(search).toLowerCase();
    return (Array.isArray(data) ? data : []).filter(item => 
      safeStr(item.clientName).toLowerCase().includes(q) ||
      safeStr(item.appUser).toLowerCase().includes(q) ||
      safeStr(item.phone).toLowerCase().includes(q)
    );
  }, [data, search]);
  
  const formatPhone = (phone) => {
    const clean = safeStr(phone).replace(/\D/g, '');
    return clean.length === 9 ? `51${clean}` : clean;
  };

  // Mensaje de WhatsApp amigable, cuidadoso y con pautas de seguridad
  const sendWhatsApp = (item) => {
    const phone = formatPhone(item.phone);
    if (!phone) { showToast("Este cliente no tiene número de WhatsApp"); return; }
    const msg = 
      `¡Hola, estimado/a *${safeStr(item.clientName)}*! 👋\n\n` +
      `Reciba un cordial y afectuoso saludo de parte del equipo de *KGB Technology*.\n\n` +
      `✅ Le escribimos para confirmarle que la instalación y configuración de su *sistema de cámaras de seguridad* ya quedó lista y funcionando en óptimas condiciones. A continuación, le hacemos entrega de sus credenciales personales de acceso:\n\n` +
      `📱 *APLICACIÓN MÓVIL (HIK-CONNECT / HILOOK)*\n` +
      `👤 *Usuario:* ${safeStr(item.appUser) || '---'}\n` +
      `🔑 *Contraseña App:* ${safeStr(item.appPass) || '---'}\n` +
      `🔐 *Código de Cifrado / Verificación:* ${safeStr(item.encryptCode) || '---'}\n\n` +
      `🖥️ *EQUIPO GRABADOR LOCAL (DVR / NVR)*\n` +
      `👤 *Usuario:* ${safeStr(item.dvrUser) || 'admin'}\n` +
      `🔑 *Contraseña DVR:* ${safeStr(item.dvrPass) || '---'}\n\n` +
      `🛡️ *PAUTAS IMPORTANTES PARA SU SEGURIDAD:*\n` +
      `1️⃣ *No comparta sus claves:* Estas credenciales son estrictamente personales; evite reenviarlas a terceros por su propia seguridad.\n` +
      `2️⃣ *Cuide su Código de Cifrado:* Es la llave que protege el video en vivo de sus cámaras.\n` +
      `3️⃣ *Dispositivos seguros:* Inicie sesión únicamente en celulares o computadoras de su entera confianza.\n` +
      `4️⃣ *Respaldo de Garantía:* En *KGB Technology* resguardamos una copia segura de estos datos exclusivamente para asistirle rápido ante cualquier soporte técnico o garantía.\n\n` +
      `Muchas gracias por su confianza. ¡Estamos a su disposición ante cualquier consulta!\n\n` +
      `Atentamente,\n*Equipo Técnico - KGB Technology*`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const resetForm = () => {
    const empty = { clientName: '', appUser: '', appPass: '', encryptCode: '', dvrUser: 'admin', dvrPass: '', phone: '' };
    setForm(empty);
    setEditingItem(null);
    setLastAutoSavedStr('');
    try { localStorage.removeItem('kgb_draft_cctv'); } catch {}
  };

  const handleSubmit = () => {
    if (!safeStr(form.clientName).trim()) {
      return showToast("El nombre del cliente es obligatorio");
    }
    const rowValues = [
      safeStr(form.clientName).trim(), 
      safeStr(form.appUser).trim(), 
      safeStr(form.appPass).trim(), 
      safeStr(form.encryptCode).trim(), 
      safeStr(form.dvrUser).trim() || 'admin', 
      safeStr(form.dvrPass).trim(), 
      safeStr(form.phone).trim()
    ];
    if (editingItem) {
      onUpdate('clients', editingItem.id, 'CCTV', editingItem.clientName, rowValues, form, false);
    } else {
      onSave('clients', 'CCTV', rowValues, form, false);
    }
    resetForm();
  };

  const startEdit = (item) => {
    const loaded = {
      clientName: safeStr(item.clientName),
      appUser: safeStr(item.appUser),
      appPass: safeStr(item.appPass),
      encryptCode: safeStr(item.encryptCode),
      dvrUser: safeStr(item.dvrUser) || 'admin',
      dvrPass: safeStr(item.dvrPass),
      phone: safeStr(item.phone)
    };
    setEditingItem(item);
    setForm(loaded);
    setLastAutoSavedStr(JSON.stringify(loaded));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Editando cliente CCTV");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className={`bg-slate-900 border ${editingItem ? 'border-amber-500/70' : 'border-slate-800'} p-6 sm:p-8 rounded-2xl shadow-xl transition-all`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><ShieldCheck size={24} /></div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tight">
                {editingItem ? 'Editando Cliente CCTV' : 'Credenciales CCTV & DVR'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Guarda o edita claves de Hik-Connect, HiLook y DVR • Autoguardado cada 1 min.</p>
            </div>
          </div>
          {editingItem && (
            <button type="button" onClick={resetForm} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/30">
              <X size={14} /> Cancelar Edición
            </button>
          )}
        </div>

        <SmartAutocomplete 
          profiles={allProfiles} 
          queryValues={[form.clientName, form.phone, form.appUser]} 
          onSelect={(p) => setForm(prev => ({
            ...prev,
            clientName: p.clientName || prev.clientName,
            phone: p.phone || prev.phone,
            appUser: p.appUser || p.email || prev.appUser,
            appPass: p.appPass || p.emailPass || prev.appPass,
            encryptCode: p.encryptCode || prev.encryptCode,
            dvrUser: p.dvrUser || prev.dvrUser || 'admin',
            dvrPass: p.dvrPass || prev.dvrPass
          }))} 
        />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 bg-slate-950/60 p-5 sm:p-6 rounded-xl border border-slate-800/70">
          <div className="xl:col-span-2 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Cliente / Empresa</label>
              <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-emerald-500" value={form.clientName} onChange={e=>setForm({...form, clientName: e.target.value})} placeholder="Ej. Ferretería San Juan - Huánuco" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Phone size={14}/> Acceso App Celular (Hik-Connect / HiLook)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario (Correo/Tel)</label>
                  <input className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value={form.appUser} onChange={e=>setForm({...form, appUser: e.target.value})} placeholder="usuario / 999..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clave de la App</label>
                  <input className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value={form.appPass} onChange={e=>setForm({...form, appPass: e.target.value})} placeholder="Clave App" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Cifrado / Verif.</label>
                  <input className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value={form.encryptCode} onChange={e=>setForm({...form, encryptCode: e.target.value})} placeholder="ABCDEF" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 flex flex-col justify-between">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Server size={14}/> Acceso Grabador DVR / NVR</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario DVR</label>
                  <input className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-blue-500" value={form.dvrUser} onChange={e=>setForm({...form, dvrUser: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña DVR</label>
                  <input className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-blue-500" value={form.dvrPass} onChange={e=>setForm({...form, dvrPass: e.target.value})} placeholder="Clave local DVR" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone size={12}/> WhatsApp del Cliente</label>
                <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-emerald-500" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="987654321" />
              </div>
              <button type="button" onClick={handleSubmit} className={`w-full py-3.5 ${editingItem ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2`}>
                <Plus size={18}/> {editingItem ? 'Guardar Cambios del Cliente' : 'Registrar Cliente CCTV'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
        <input type="text" placeholder="Buscar cliente por nombre, usuario o teléfono..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredData.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-all shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 border-b border-slate-800 pb-4 gap-4">
              <div className="min-w-0 pr-2">
                <h4 className="text-xl font-black text-white italic uppercase tracking-tight truncate">{safeStr(item.clientName)}</h4>
                {safeStr(item.phone) && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1"><Phone size={13}/> {safeStr(item.phone)}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button type="button" onClick={() => sendWhatsApp(item)} className="px-3.5 py-2 bg-[#25D366] hover:bg-[#128c7e] text-white rounded-xl transition-all shadow-lg flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  <Send size={14}/> Enviar Claves
                </button>
                <button type="button" onClick={() => startEdit(item)} className="px-3 py-2 text-amber-400 hover:text-white bg-slate-950 hover:bg-amber-600 rounded-xl transition-all border border-slate-800 flex items-center gap-1 text-xs font-black uppercase">
                  <EditIcon size={14} /> Editar
                </button>
                <button type="button" onClick={() => onDelete('clients', item.id, 'CCTV', item.clientName)} className="p-2 text-slate-500 hover:text-rose-500 bg-slate-950 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-800">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/70">
                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-1">App Hik-Connect / HiLook</h5>
                <DataRow value={item.appUser} label="Usuario App" icon={Phone} color="emerald" onCopy={onCopy} />
                <DataRow value={item.appPass} label="Clave App" icon={Lock} color="emerald" onCopy={onCopy} />
                <DataRow value={item.encryptCode} label="Cód. Cifrado" icon={Key} color="emerald" onCopy={onCopy} />
              </div>
              <div className="bg-blue-950/10 p-4 rounded-xl border border-blue-900/30">
                <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 px-1">Grabador Local DVR</h5>
                <DataRow value={item.dvrUser || 'admin'} label="Usuario DVR" icon={Server} color="blue" onCopy={onCopy} />
                <DataRow value={item.dvrPass} label="Clave DVR" icon={Lock} color="blue" onCopy={onCopy} />
              </div>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold bg-slate-900/40 rounded-2xl border border-slate-800/60">
            No hay clientes CCTV registrados todavía.
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MÓDULO 3: EQUIPOS IP Y GARANTÍAS (CÁMARAS IP, CLAVES, QR, SERIE, IP)
// ============================================================================
const IPEquipModule = ({ data, allProfiles, onSave, onUpdate, onDelete, onCopy, showToast }) => {
  const [form, setForm] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('kgb_draft_ip');
      return savedDraft ? JSON.parse(savedDraft) : { client: '', model: '', ip: '', camUser: 'admin', camPass: '', serial: '', qrCode: '', link: '', date: '' };
    } catch {
      return { client: '', model: '', ip: '', camUser: 'admin', camPass: '', serial: '', qrCode: '', link: '', date: '' };
    }
  });
  const [editingItem, setEditingItem] = useState(null);
  const [lastAutoSavedStr, setLastAutoSavedStr] = useState('');
  const [search, setSearch] = useState('');

  // Guardar borrador local mientras se llena el formulario
  useEffect(() => {
    try { localStorage.setItem('kgb_draft_ip', JSON.stringify(form)); } catch {}
  }, [form]);

  // Autoguardado cada 1 minuto (60,000 ms)
  useEffect(() => {
    const timer = setInterval(() => {
      const clientTrim = safeStr(form.client).trim();
      if (!clientTrim) return;

      const snapshot = JSON.stringify(form);
      if (snapshot === lastAutoSavedStr) return;

      const rowValues = [
        clientTrim,
        safeStr(form.model).trim(),
        safeStr(form.ip).trim(),
        safeStr(form.camUser).trim() || 'admin',
        safeStr(form.camPass).trim(),
        safeStr(form.serial).trim(),
        safeStr(form.qrCode).trim(),
        safeStr(form.link).trim(),
        safeStr(form.date)
      ];

      if (editingItem) {
        onUpdate('cameras', editingItem.id, 'EquiposIP', editingItem.client || editingItem.clientName, rowValues, form, true);
      } else {
        const created = onSave('cameras', 'EquiposIP', rowValues, form, true);
        if (created) setEditingItem(created);
      }
      setLastAutoSavedStr(snapshot);
    }, 60000);
    return () => clearInterval(timer);
  }, [form, editingItem, lastAutoSavedStr, onSave, onUpdate]);

  // Filtro 100% blindado contra errores de propiedades undefined
  const filteredData = useMemo(() => {
    const q = safeStr(search).toLowerCase();
    return (Array.isArray(data) ? data : []).filter(item => {
      const clientText = safeStr(item.client || item.clientName).toLowerCase();
      const ipText = safeStr(item.ip).toLowerCase();
      const serialText = safeStr(item.serial).toLowerCase();
      const modelText = safeStr(item.model).toLowerCase();
      return clientText.includes(q) || ipText.includes(q) || serialText.includes(q) || modelText.includes(q);
    });
  }, [data, search]);

  const resetForm = () => {
    const empty = { client: '', model: '', ip: '', camUser: 'admin', camPass: '', serial: '', qrCode: '', link: '', date: '' };
    setForm(empty);
    setEditingItem(null);
    setLastAutoSavedStr('');
    try { localStorage.removeItem('kgb_draft_ip'); } catch {}
  };

  const handleSubmit = () => {
    if (!safeStr(form.client).trim()) {
      return showToast("El cliente o ubicación de la cámara es obligatorio");
    }
    const rowValues = [
      safeStr(form.client).trim(),
      safeStr(form.model).trim(),
      safeStr(form.ip).trim(),
      safeStr(form.camUser).trim() || 'admin',
      safeStr(form.camPass).trim(),
      safeStr(form.serial).trim(),
      safeStr(form.qrCode).trim(),
      safeStr(form.link).trim(),
      safeStr(form.date)
    ];
    if (editingItem) {
      onUpdate('cameras', editingItem.id, 'EquiposIP', editingItem.client || editingItem.clientName, rowValues, form, false);
    } else {
      onSave('cameras', 'EquiposIP', rowValues, form, false);
    }
    resetForm();
  };

  const startEdit = (item) => {
    const loaded = {
      client: safeStr(item.client || item.clientName),
      model: safeStr(item.model),
      ip: safeStr(item.ip),
      camUser: safeStr(item.camUser) || 'admin',
      camPass: safeStr(item.camPass),
      serial: safeStr(item.serial),
      qrCode: safeStr(item.qrCode),
      link: safeStr(item.link),
      date: safeStr(item.date)
    };
    setEditingItem(item);
    setForm(loaded);
    setLastAutoSavedStr(JSON.stringify(loaded));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Editando cámara IP");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className={`bg-slate-900 border ${editingItem ? 'border-amber-500/70' : 'border-slate-800'} p-6 sm:p-8 rounded-2xl shadow-xl transition-all`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20"><Cctv size={24} /></div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tight">
                {editingItem ? 'Editando Cámara IP' : 'Cámaras IP, Claves y Garantías'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Registra o edita la IP, usuario/clave, QR/serie y fecha • Autoguardado cada 1 min.</p>
            </div>
          </div>
          {editingItem && (
            <button type="button" onClick={resetForm} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/30">
              <X size={14} /> Cancelar Edición
            </button>
          )}
        </div>

        <SmartAutocomplete 
          profiles={allProfiles} 
          queryValues={[form.client, form.ip]} 
          onSelect={(p) => setForm(prev => ({
            ...prev,
            client: p.clientName || prev.client,
            camUser: p.dvrUser || prev.camUser || 'admin',
            camPass: p.dvrPass || p.appPass || prev.camPass,
            qrCode: p.encryptCode || prev.qrCode,
            ip: p.ip || prev.ip
          }))} 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-950/60 p-5 sm:p-6 rounded-xl border border-slate-800/70">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Ubicación de la Cámara</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.client} onChange={e=>setForm({...form, client: e.target.value})} placeholder="Ej. Clínica Huánuco - Cámara Puerta Principal" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo de Cámara IP</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.model} onChange={e=>setForm({...form, model: e.target.value})} placeholder="Ej. IPC-B120 / Ezviz / Imou" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección IP Local</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500 font-mono" value={form.ip} onChange={e=>setForm({...form, ip: e.target.value})} placeholder="192.168.1.64" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Usuario Cámara IP</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.camUser} onChange={e=>setForm({...form, camUser: e.target.value})} placeholder="admin" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Clave Cámara IP</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.camPass} onChange={e=>setForm({...form, camPass: e.target.value})} placeholder="Contraseña de la cámara" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Serie (S/N)</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500 font-mono" value={form.serial} onChange={e=>setForm({...form, serial: e.target.value})} placeholder="J12345678" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código QR / Verificación</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500 font-mono" value={form.qrCode} onChange={e=>setForm({...form, qrCode: e.target.value})} placeholder="Código del sticker QR" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Instalación (Garantía)</label>
            <input type="date" className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link de Foto QR / Acceso Web (Opcional)</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.link} onChange={e=>setForm({...form, link: e.target.value})} placeholder="https://drive.google.com/... o http://192.168..." />
          </div>
          
          <div className="flex items-end">
            <button type="button" onClick={handleSubmit} className={`w-full py-3.5 ${editingItem ? 'bg-amber-600 hover:bg-amber-500' : 'bg-orange-600 hover:bg-orange-500'} text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2`}>
              <Plus size={18}/> {editingItem ? 'Actualizar Cámara IP' : 'Guardar Cámara IP'}
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
        <input type="text" placeholder="Buscar cámara por cliente, IP, serie o modelo..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-sm font-bold outline-none focus:border-orange-500 transition-all shadow-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredData.map(item => {
          const clientDisplay = safeStr(item.client || item.clientName) || 'Equipo Sin Nombre';
          return (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-orange-500/50 transition-all flex flex-col shadow-xl">
              <div className="flex items-start justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/20"><Cctv size={20} /></div>
                  <div className="min-w-0">
                    <h4 className="font-black text-white text-base italic uppercase tracking-tight truncate">{clientDisplay}</h4>
                    <span className="text-[11px] text-orange-400 font-bold uppercase tracking-widest block mt-0.5">{safeStr(item.model) || 'Cámara IP'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => startEdit(item)} className="px-2.5 py-1.5 text-amber-400 hover:text-white bg-slate-950 hover:bg-amber-600 rounded-xl transition-all border border-slate-800 flex items-center gap-1 text-[10px] font-black uppercase">
                    <EditIcon size={13} /> Editar
                  </button>
                  <button type="button" onClick={() => onDelete('cameras', item.id, 'EquiposIP', clientDisplay)} className="p-2 text-slate-500 hover:text-rose-500 bg-slate-950 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-800">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                <DataRow value={item.ip} label="Dirección IP" icon={Server} color="orange" onCopy={onCopy} />
                <DataRow value={item.camUser || 'admin'} label="Usuario Cámara" icon={Users} color="orange" onCopy={onCopy} />
                <DataRow value={item.camPass} label="Clave Cámara" icon={Lock} color="orange" onCopy={onCopy} />
                <DataRow value={item.serial} label="Número de Serie" icon={Key} color="orange" onCopy={onCopy} />
                {safeStr(item.qrCode) && (
                  <DataRow value={item.qrCode} label="Código QR / Verificación" icon={QrCode} color="orange" onCopy={onCopy} />
                )}
                
                {(safeStr(item.link) || safeStr(item.date)) && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2.5">
                    {safeStr(item.link) && (
                      <a href={safeStr(item.link)} target="_blank" rel="noreferrer" className="text-xs font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 w-fit">
                        <LinkIcon size={14}/> Abrir Enlace / Ver QR
                      </a>
                    )}
                    {safeStr(item.date) && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        <Calendar size={14} className="text-orange-400"/> Instalado: <span className="text-slate-200">{safeStr(item.date)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredData.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold bg-slate-900/40 rounded-2xl border border-slate-800/60">
            No hay cámaras IP registradas todavía.
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DE LA BÓVEDA
// ============================================================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('kgb_auth') === 'true');
  const [showPreloader, setShowPreloader] = useState(true);
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [activeTab, setActiveTab] = useState('personal'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('checking'); 
  const [isLoading, setIsLoading] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState('Activo');

  // URL de Google Sheets editable desde la interfaz
  const [sheetsUrl, setSheetsUrl] = useState(() => {
    return localStorage.getItem('kgb_sheets_url_v13') || DEFAULT_SHEETS_URL;
  });
  const [tempUrl, setTempUrl] = useState(sheetsUrl);
  
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('kgb_v12_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          personal: Array.isArray(parsed.personal) ? parsed.personal : [],
          clients: Array.isArray(parsed.clients) ? parsed.clients : [],
          cameras: Array.isArray(parsed.cameras) ? parsed.cameras : []
        };
      }
      return { personal: [], clients: [], cameras: [] };
    } catch { 
      return { personal: [], clients: [], cameras: [] }; 
    }
  });

  // Directorio unificado inteligente para autocompletar en todos los módulos
  const clientDirectory = useMemo(() => {
    const map = new Map();

    const upsertProfile = (key, fields) => {
      const cleanKey = safeStr(key).trim().toLowerCase();
      if (!cleanKey) return;
      const existing = map.get(cleanKey) || {};
      map.set(cleanKey, {
        name: fields.name || existing.name || '',
        phone: fields.phone || existing.phone || '',
        email: fields.email || existing.email || '',
        password: fields.password || existing.password || '',
        appUser: fields.appUser || existing.appUser || '',
        appPass: fields.appPass || existing.appPass || '',
        encryptCode: fields.encryptCode || existing.encryptCode || '',
        dvrUser: fields.dvrUser || existing.dvrUser || '',
        dvrPass: fields.dvrPass || existing.dvrPass || '',
        ip: fields.ip || existing.ip || '',
        model: fields.model || existing.model || ''
      });
    };

    (data.personal || []).forEach(item => {
      const tagName = safeStr(item.tags).trim();
      const email = safeStr(item.email).trim();
      upsertProfile(tagName || email, {
        name: tagName,
        email: email,
        password: safeStr(item.password)
      });
    });

    (data.clients || []).forEach(item => {
      const name = safeStr(item.clientName).trim();
      const appUser = safeStr(item.appUser).trim();
      upsertProfile(name || item.phone || appUser, {
        name,
        phone: safeStr(item.phone),
        email: appUser.includes('@') ? appUser : '',
        appUser,
        appPass: safeStr(item.appPass),
        password: safeStr(item.appPass),
        encryptCode: safeStr(item.encryptCode),
        dvrUser: safeStr(item.dvrUser),
        dvrPass: safeStr(item.dvrPass)
      });
    });

    (data.cameras || []).forEach(item => {
      const name = safeStr(item.client || item.clientName).trim();
      upsertProfile(name || item.ip, {
        name,
        ip: safeStr(item.ip),
        model: safeStr(item.model),
        dvrUser: safeStr(item.camUser),
        dvrPass: safeStr(item.camPass)
      });
    });

    return Array.from(map.values());
  }, [data]);

  const [syncQueue, setSyncQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kgb_v12_queue')) || []; } catch { return []; }
  });

  const showMsg = useCallback((text) => { 
    setNotification(text); 
    setTimeout(() => setNotification(null), 3200); 
  }, []);

  // Guardar datos locales y procesar cola hacia Google Sheets
  useEffect(() => {
    localStorage.setItem('kgb_v12_data', JSON.stringify(data));
    localStorage.setItem('kgb_v12_queue', JSON.stringify(syncQueue));
    if (syncQueue.length > 0) {
      processSyncQueue();
    }
  }, [data, syncQueue]);

  const processSyncQueue = async () => {
    if (syncQueue.length === 0 || !sheetsUrl) return;
    const item = syncQueue[0];
    try {
      await fetch(sheetsUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify(item) 
      });
      setSyncQueue(prev => prev.slice(1));
      setCloudStatus('online');
    } catch (e) {
      setCloudStatus('offline');
    }
  };

  const fetchCloudData = useCallback(async (customUrl) => {
    const targetUrl = customUrl || sheetsUrl;
    if (!targetUrl) return;
    setIsLoading(true); 
    setCloudStatus('checking');
    try {
      const response = await fetch(targetUrl, { method: 'GET' });
      const result = await response.json();
      if (result && result.status !== 'error') {
        setData(prev => ({ 
          personal: Array.isArray(result.personal) ? result.personal.reverse() : prev.personal, 
          clients: Array.isArray(result.clients) ? result.clients.reverse() : prev.clients, 
          cameras: Array.isArray(result.cameras) ? result.cameras.reverse() : prev.cameras,
        }));
        setCloudStatus('online');
        showMsg("Sincronizado con Google Sheets");
      } else {
        setCloudStatus('offline');
      }
    } catch (e) { 
      setCloudStatus('offline'); 
    } finally { 
      setIsLoading(false); 
    }
  }, [sheetsUrl, showMsg]);

  useEffect(() => { 
    fetchCloudData(); 
  }, [fetchCloudData]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPass === 'S15t3w4s@@') {
      sessionStorage.setItem('kgb_auth', 'true');
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  // Copiado compatible con todos los navegadores
  const handleCopy = useCallback((val) => {
    const text = safeStr(val);
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showMsg("Copiado al portapapeles");
  }, [showMsg]);

  const handleSave = useCallback((type, sheetName, valuesForSheet, formData, isAutoSave = false) => {
    const newId = "kgb_" + Date.now();
    const fechaActual = new Date().toLocaleString();
    const newItem = { id: newId, ...formData, createdAt: fechaActual };
    
    setData(prev => ({ ...prev, [type]: [newItem, ...(prev[type] || [])] }));
    setSyncQueue(prev => [...prev, { 
      action: 'add', 
      sheet: sheetName, 
      values: [newId, fechaActual, ...valuesForSheet] 
    }]);
    showMsg(isAutoSave ? "Autoguardado automático (1 min)" : "Guardado en Bóveda y Google Sheets");
    return newItem;
  }, [showMsg]);

  // Actualizar registro existente (tanto en memoria local como en Google Sheets)
  const handleUpdate = useCallback((type, id, sheetName, oldKeyValue, valuesForSheet, formData, isAutoSave = false) => {
    const fechaActual = new Date().toLocaleString();
    const updatedItem = { id, ...formData, createdAt: fechaActual };

    setData(prev => ({
      ...prev,
      [type]: (prev[type] || []).map(item => item.id === id ? updatedItem : item)
    }));

    // Para máxima compatibilidad con tu Google Sheets actual: reemplaza la fila anterior y añade la actualizada
    setSyncQueue(prev => [
      ...prev,
      { action: 'delete', sheet: sheetName, id: id, value: oldKeyValue },
      { action: 'add', sheet: sheetName, values: [id, fechaActual, ...valuesForSheet] }
    ]);

    showMsg(isAutoSave ? "Cambios autoguardados (1 min)" : "Registro actualizado correctamente");
  }, [showMsg]);

  const handleDelete = useCallback((type, id, sheetName, keyValue) => {
    setData(prev => ({ ...prev, [type]: (prev[type] || []).filter(x => x.id !== id) }));
    setSyncQueue(prev => [...prev, { action: 'delete', sheet: sheetName, id: id, value: keyValue }]);
    showMsg("Registro eliminado");
  }, [showMsg]);

  // Índice unificado de todos los clientes/correos/equipos para el Autocompletado Inteligente
  const allProfiles = useMemo(() => {
    const map = new Map();

    (data.clients || []).forEach(c => {
      const key = safeStr(c.clientName || c.phone || c.id).toLowerCase();
      if (!key) return;
      map.set(key, {
        clientName: safeStr(c.clientName),
        phone: safeStr(c.phone),
        appUser: safeStr(c.appUser),
        appPass: safeStr(c.appPass),
        encryptCode: safeStr(c.encryptCode),
        dvrUser: safeStr(c.dvrUser) || 'admin',
        dvrPass: safeStr(c.dvrPass),
        email: safeStr(c.appUser).includes('@') ? safeStr(c.appUser) : '',
        emailPass: '',
        ip: ''
      });
    });

    (data.personal || []).forEach(p => {
      const tagKey = safeStr(p.tags || p.email || p.id).toLowerCase();
      if (!tagKey) return;
      const existing = map.get(tagKey) || {};
      map.set(tagKey, {
        ...existing,
        clientName: existing.clientName || safeStr(p.tags),
        email: safeStr(p.email),
        emailPass: safeStr(p.password),
        appUser: existing.appUser || safeStr(p.email)
      });
    });

    (data.cameras || []).forEach(cam => {
      const cName = safeStr(cam.client || cam.clientName);
      const key = cName.toLowerCase() || safeStr(cam.id);
      if (!key) return;
      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        clientName: existing.clientName || cName,
        ip: safeStr(cam.ip) || existing.ip || '',
        dvrUser: existing.dvrUser || safeStr(cam.camUser) || 'admin',
        dvrPass: existing.dvrPass || safeStr(cam.camPass) || ''
      });
    });

    return Array.from(map.values());
  }, [data]);

  const handleSaveSheetsUrl = async () => {
    const cleanUrl = tempUrl.trim();
    if (!cleanUrl.startsWith('https://script.google.com/')) {
      return showToastAlert("La URL debe empezar con https://script.google.com/...");
    }
    localStorage.setItem('kgb_sheets_url_v13', cleanUrl);
    setSheetsUrl(cleanUrl);
    setIsConfigOpen(false);
    showMsg("Conectando e inicializando hojas...");
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'init' })
      });
    } catch (e) {}
    fetchCloudData(cleanUrl);
  };

  const showToastAlert = (msg) => showMsg(msg);

  // Enviar todos los registros locales actuales a una nueva hoja de Google Sheets
  const pushAllLocalToCloud = () => {
    const newQueue = [];
    (data.personal || []).forEach(item => {
      newQueue.push({
        action: 'add',
        sheet: 'Correos',
        values: [item.id || 'kgb_'+Date.now(), item.createdAt || new Date().toLocaleString(), item.platform || 'Gmail', item.email || '', item.password || '', item.tags || '']
      });
    });
    (data.clients || []).forEach(item => {
      newQueue.push({
        action: 'add',
        sheet: 'CCTV',
        values: [item.id || 'kgb_'+Date.now(), item.createdAt || new Date().toLocaleString(), item.clientName || '', item.appUser || '', item.appPass || '', item.encryptCode || '', item.dvrUser || 'admin', item.dvrPass || '', item.phone || '']
      });
    });
    (data.cameras || []).forEach(item => {
      newQueue.push({
        action: 'add',
        sheet: 'EquiposIP',
        values: [item.id || 'kgb_'+Date.now(), item.createdAt || new Date().toLocaleString(), item.client || item.clientName || '', item.model || '', item.ip || '', item.camUser || 'admin', item.camPass || '', item.serial || '', item.qrCode || '', item.link || '', item.date || '']
      });
    });
    setSyncQueue(prev => [...prev, ...newQueue]);
    setIsConfigOpen(false);
    showMsg(`Subiendo ${newQueue.length} registros a Google Sheets...`);
  };

  const TABS = [
    { id: 'personal', name: 'Banco de Correos', icon: Mail, count: (data.personal || []).length, color: 'text-blue-400', bg: 'bg-blue-600/15 border-blue-500/30' },
    { id: 'clients', name: 'Accesos CCTV', icon: ShieldCheck, count: (data.clients || []).length, color: 'text-emerald-400', bg: 'bg-emerald-600/15 border-emerald-500/30' },
    { id: 'cameras', name: 'Equipos IP', icon: Cctv, count: (data.cameras || []).length, color: 'text-orange-400', bg: 'bg-orange-600/15 border-orange-500/30' },
  ];

  if (showPreloader) {
    return (
      <div className="flex h-screen bg-[#020617] items-center justify-center flex-col gap-5">
        <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/30 animate-pulse shadow-2xl">
          <ShieldCheck size={42} />
        </div>
        <h1 className="text-2xl font-black italic tracking-tighter text-white">Vault<span className="text-blue-500">KGB</span></h1>
        <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em]">Iniciando Bóveda Segura...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-[#020617] items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20"><Lock size={32}/></div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black italic tracking-tighter text-white mb-1">Vault<span className="text-blue-500">KGB</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acceso Privado KGB Technology</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                <input 
                  type="password" 
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="Ingresa la clave maestra..." 
                  className={`w-full pl-12 pr-4 py-4 bg-slate-950 border ${loginError ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'} text-white rounded-2xl text-sm font-bold outline-none transition-all`}
                  autoFocus
                />
              </div>
              {loginError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">Contraseña incorrecta</p>}
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-blue-600/30">
              Desbloquear Bóveda
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      {/* Notificación flotante */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 border border-slate-700 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl transition-all duration-300 ${notification ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <CheckCircle size={18} className="text-blue-400 shrink-0" />
        <span className="text-xs font-black uppercase tracking-wider text-white">{notification}</span>
      </div>

      {/* Modal de Configuración de Google Sheets */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20"><Database size={20}/></div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic">Conexión Google Sheets</h3>
                  <p className="text-xs text-slate-400">Vincula tu hoja de cálculo con creación automática de columnas</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsConfigOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"><X size={18}/></button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL de Aplicación Web (Google Apps Script)</label>
              <input 
                type="text" 
                value={tempUrl} 
                onChange={e => setTempUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-mono outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                <AlertCircle size={15} className="text-blue-400 shrink-0 mt-0.5"/>
                Pega el código del archivo <strong className="text-white">CodigoGoogleSheets.gs</strong> en tu Google Sheet en blanco, publícalo como "Aplicación Web" con acceso para "Cualquier persona" y pega aquí el link que termina en <strong className="text-emerald-400">/exec</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" onClick={handleSaveSheetsUrl} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all">
                Guardar y Conectar Hoja
              </button>
              <button type="button" onClick={pushAllLocalToCloud} className="px-4 py-3.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 border border-slate-700">
                <UploadCloud size={16}/> Subir Datos Locales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera Móvil (Con botón Hamburguesa a la IZQUIERDA) */}
      <div className="lg:hidden fixed top-0 w-full h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-800 rounded-xl text-slate-200 hover:text-white border border-slate-700">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><ShieldCheck size={18}/></div>
            <span className="font-black text-lg italic text-white">Vault<span className="text-blue-500">KGB</span></span>
          </div>
        </div>
        <button type="button" onClick={() => { setTempUrl(sheetsUrl); setIsConfigOpen(true); }} className="p-2 bg-slate-800 text-slate-300 rounded-xl border border-slate-700">
          <Settings size={18}/>
        </button>
      </div>

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Barra Lateral Izquierda Fija */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex-1 flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20"><ShieldCheck size={26}/></div>
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none">Vault<span className="text-blue-500">KGB</span></h1>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">GESTOR DE CLAVES v12</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><X size={18}/></button>
          </div>

          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Módulos de Claves</div>
          <nav className="space-y-2 flex-1">
            {TABS.map(t => {
              const isActive = activeTab === t.id;
              return (
                <button 
                  type="button" 
                  key={t.id} 
                  onClick={() => { setActiveTab(t.id); setIsSidebarOpen(false); }} 
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${isActive ? `${t.bg} ${t.color}` : 'text-slate-400 hover:text-white hover:bg-slate-800/70 border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <t.icon size={19} className={isActive ? '' : 'text-slate-500'} /> 
                    <span>{t.name}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-950/80 text-slate-300 border border-slate-800">{t.count}</span>
                </button>
              );
            })}
          </nav>

          {/* Panel de Sincronización con Google Sheets */}
          <div className="mt-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Sheets</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {syncQueue.length > 0 ? `PEND (${syncQueue.length})` : cloudStatus === 'online' ? 'CONECTADO' : 'LOCAL'}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'}`}></div>
              </div>
            </div>
            
            <button type="button" onClick={() => fetchCloudData()} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50">
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> {isLoading ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </button>

            <button type="button" onClick={() => { setTempUrl(sheetsUrl); setIsConfigOpen(true); }} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              <Settings size={13} /> Configurar URL Sheets
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#020617] pt-16 lg:pt-0 relative">
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-10 py-8 z-10 relative">
          <header className="hidden lg:flex items-center justify-between mb-8 pb-5 border-b border-slate-800/80">
            <h2 className="text-2xl font-black italic text-white tracking-tight uppercase">
              {TABS.find(t => t.id === activeTab)?.name}
            </h2>
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Clock size={13} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Autoguardado 1m: {lastAutoSave}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2.5 border ${cloudStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {cloudStatus === 'online' ? 'Google Sheets Conectado' : 'Guardado Local Activo'}
                </span>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto pb-20">
            {activeTab === 'personal' && <EmailsModule data={data.personal} allProfiles={allProfiles} onSave={handleSave} onUpdate={handleUpdate} onDelete={handleDelete} onCopy={handleCopy} showToast={showMsg} />}
            {activeTab === 'clients' && <CCTVModule data={data.clients} allProfiles={allProfiles} onSave={handleSave} onUpdate={handleUpdate} onDelete={handleDelete} onCopy={handleCopy} showToast={showMsg} />}
            {activeTab === 'cameras' && <IPEquipModule data={data.cameras} allProfiles={allProfiles} onSave={handleSave} onUpdate={handleUpdate} onDelete={handleDelete} onCopy={handleCopy} showToast={showMsg} />}
          </div>
        </div>
      </main>
    </div>
  );
}