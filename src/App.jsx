import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { 
  ShieldCheck, Mail, Users, Cctv, Plus, Copy, Trash2, RefreshCw, Menu, X, 
  CheckCircle, Send, Key, Phone, Search, Link as LinkIcon, Calendar, Lock, Server, AtSign
} from 'lucide-react';

const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbxpZszMD7ac4nLU0w_Gw7mZ8DZSV9H1ALaYI3uyTq0KhcOZgH7x51bS81PknEJK1sqG/exec"; 

const DataRow = memo(({ value, icon: IconCmp, onCopy, label, color = "blue" }) => {
  return (
    <div className={`flex items-center justify-between gap-3 p-4 bg-slate-900/80 rounded-xl border border-slate-800 mb-3 hover:border-${color}-500/30 transition-colors shadow-sm`}>
      <div className="flex flex-col min-w-0 flex-1">
        {label && <span className={`text-[10px] font-black text-${color}-400/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5`}>
          {IconCmp && <IconCmp size={14} className={`text-${color}-500/60 shrink-0`} />} {label}
        </span>}
        {/* Contraseña/Valor SIEMPRE visible */}
        <span className="text-sm font-bold text-slate-100 truncate tracking-wide font-mono bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
          {value || '---'}
        </span>
      </div>
      {/* Botón de copiar bien explícito */}
      <button 
        type="button" 
        onClick={(e) => { e.preventDefault(); onCopy(value); }} 
        className={`flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-${color}-600 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700 hover:border-${color}-500 shrink-0 shadow-md group`}
        title="Copiar dato"
      >
        <Copy size={16} className={`text-${color}-400 group-hover:text-white transition-colors`}/>
        <span className="text-[11px] font-black uppercase tracking-wider hidden sm:inline-block">Copiar</span>
      </button>
    </div>
  );
});

const EmailsModule = ({ data, onSave, onDelete, onCopy, showToast }) => {
  const [form, setForm] = useState({ platform: 'Gmail', email: '', password: '', tags: '' });
  const [search, setSearch] = useState('');
  
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.email.toLowerCase().includes(search.toLowerCase()) || 
      (item.tags && item.tags.toLowerCase().includes(search.toLowerCase()))
    );
  }, [data, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20"><Mail size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Registro de Correos</h2>
            <p className="text-xs text-slate-400 font-medium">Añade cuentas pre-creadas para tus proyectos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plataforma</label>
            <select className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.platform} onChange={e=>setForm({...form, platform: e.target.value})}>
              <option value="Gmail">Gmail</option><option value="Hotmail/Outlook">Hotmail/Outlook</option><option value="Yahoo">Yahoo</option><option value="Otro">Otro</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="usuario@gmail.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Clave123" />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asignación / Cliente (Opcional)</label>
            <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.tags} onChange={e=>setForm({...form, tags: e.target.value})} placeholder="Ej. Asignado a Empresa X" />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={() => { 
              if(!form.email || !form.password) return showToast("Correo y contraseña son obligatorios");
              onSave('personal', 'Correos', [form.platform, form.email, form.password, form.tags], form); 
              setForm({platform:'Gmail', email:'', password:'', tags:''}); 
            }} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
              <Plus size={18}/> Guardar Cuenta
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
        <input type="text" placeholder="Buscar correo o cliente asignado..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-lg shadow-slate-950/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredData.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group relative flex flex-col shadow-xl shadow-slate-950/50">
            
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Mail size={16}/></div>
                 <span className="text-sm font-black text-white uppercase tracking-wider">{item.platform || 'Correo'}</span>
               </div>
               <button type="button" onClick={() => onDelete('personal', item.id, 'Correos', item.email)} className="text-slate-500 hover:text-rose-500 bg-slate-900 hover:bg-rose-500/10 p-2 rounded-lg transition-all border border-slate-800 hover:border-rose-500/30 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
            </div>
            
            <div className="p-5 flex-1 flex flex-col bg-slate-900/50">
              <DataRow value={item.email} icon={AtSign} label="Dirección de Correo" color="blue" onCopy={onCopy} />
              <DataRow value={item.password} icon={Lock} label="Contraseña" color="blue" onCopy={onCopy} />
              
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
                <Users size={14} className="text-slate-500"/>
                <span className="text-xs text-slate-300 font-bold truncate">{item.tags || <span className="text-emerald-500/80">Disponible / Sin asignar</span>}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold">No se encontraron correos en el registro.</div>}
      </div>
    </div>
  );
};

const CCTVModule = ({ data, onSave, onDelete, onCopy, showToast }) => {
  const [form, setForm] = useState({ clientName: '', appUser: '', appPass: '', encryptCode: '', dvrUser: 'admin', dvrPass: '', phone: '' });
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => data.filter(item => item.clientName.toLowerCase().includes(search.toLowerCase())), [data, search]);
  
  const formatPhone = (phone) => {
      const clean = phone.toString().replace(/\D/g, '');
      return clean.length === 9 ? `51${clean}` : clean;
  };

  const sendWhatsApp = (item) => {
    const phone = formatPhone(item.phone);
    if (!phone) { showToast("Cliente no tiene número registrado"); return; }
    const msg = `*Estimado/a ${item.clientName},*\n\nReciba un cordial saludo de *KGB Technology*.\nSu sistema de seguridad CCTV ha sido configurado correctamente. Aquí tiene sus accesos:\n\n🔹 *APP HIK-CONNECT / HILOOK*\n👤 *Usuario:* ${item.appUser}\n🔑 *Clave App:* ${item.appPass}\n🔐 *Cód. Verificación (Cifrado):* ${item.encryptCode}\n\n🔹 *ACCESO LOCAL (DVR/NVR)*\n👤 *Usuario:* ${item.dvrUser || 'admin'}\n🔑 *Clave DVR:* ${item.dvrPass}\n\n⚠️ *NOTA:* Mantenga estos datos en un lugar seguro. KGB Technology guarda una copia cifrada estrictamente para brindarle soporte técnico y garantía.\n\nGracias por su confianza.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><ShieldCheck size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Clientes CCTV</h2>
            <p className="text-xs text-slate-400 font-medium">Gestión de Accesos DVR y Apps Móviles.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
          <div className="xl:col-span-2 space-y-5">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Cliente / Empresa</label>
                <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-emerald-500" value={form.clientName} onChange={e=>setForm({...form, clientName: e.target.value})} placeholder="Ej. Minimarket Don Pepe" />
             </div>

             <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-inner">
                <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Phone size={14}/> Credenciales App (Celular)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario App</label>
                    <input className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value={form.appUser} onChange={e=>setForm({...form, appUser: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clave App</label>
                    <input className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value={form.appPass} onChange={e=>setForm({...form, appPass: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cód. Cifrado</label>
                    <input className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value={form.encryptCode} onChange={e=>setForm({...form, encryptCode: e.target.value})} />
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-5 flex flex-col justify-between">
             <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-inner">
                <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Server size={14}/> Acceso Local DVR</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario DVR</label>
                    <input className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-blue-500" value={form.dvrUser} onChange={e=>setForm({...form, dvrUser: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clave DVR</label>
                    <input className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-sm font-bold outline-none focus:border-blue-500" value={form.dvrPass} onChange={e=>setForm({...form, dvrPass: e.target.value})} />
                  </div>
                </div>
             </div>

             <div className="space-y-3">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone size={12}/> WhatsApp del Cliente</label>
                  <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-emerald-500" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="9..." />
               </div>
               <button type="button" onClick={() => { 
                  if(!form.clientName) return showToast("El nombre del cliente es obligatorio");
                  onSave('clients', 'CCTV', [form.clientName, form.appUser, form.appPass, form.encryptCode, form.dvrUser, form.dvrPass, form.phone], form); 
                  setForm({clientName:'', appUser:'', appPass:'', encryptCode:'', dvrUser:'admin', dvrPass:'', phone:''}); 
               }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all shadow-lg shadow-emerald-500/20">
                  Guardar Cliente CCTV
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
        <input type="text" placeholder="Buscar cliente CCTV..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-lg shadow-slate-950/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredData.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl group relative hover:border-emerald-500/50 transition-all shadow-xl shadow-slate-950/50">
            
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 border-b border-slate-800 pb-5 gap-4">
              <div className="min-w-0 pr-4">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tight truncate">{item.clientName}</h4>
                {item.phone && <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mt-1.5"><Phone size={14}/> {item.phone}</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button type="button" onClick={() => sendWhatsApp(item)} className="px-4 py-2.5 bg-[#25D366] hover:bg-[#128c7e] text-white rounded-xl transition-all shadow-lg shadow-[#25D366]/20 flex items-center gap-2 text-xs font-black uppercase tracking-wider" title="Enviar Claves">
                  <Send size={16}/> Enviar
                </button>
                <button type="button" onClick={() => onDelete('clients', item.id, 'CCTV', item.clientName)} className="p-2.5 text-slate-500 hover:text-rose-500 bg-slate-950 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-800 hover:border-rose-500/30"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 px-1">App Hik-Connect</h5>
                <DataRow value={item.appUser} label="Usuario App" icon={Phone} color="emerald" onCopy={onCopy} />
                <DataRow value={item.appPass} label="Clave App" icon={Lock} color="emerald" onCopy={onCopy} />
                <DataRow value={item.encryptCode} label="Cód. Cifrado" icon={Key} color="emerald" onCopy={onCopy} />
              </div>
              <div className="bg-blue-950/10 p-4 rounded-xl border border-blue-900/30">
                <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 px-1">Hardware Local</h5>
                <DataRow value={item.dvrUser || 'admin'} label="Usuario DVR" icon={Server} color="blue" onCopy={onCopy} />
                <DataRow value={item.dvrPass} label="Clave DVR" icon={Lock} color="blue" onCopy={onCopy} />
              </div>
            </div>

          </div>
        ))}
        {filteredData.length === 0 && <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold">No se encontraron clientes CCTV en el registro.</div>}
      </div>
    </div>
  );
};

const IPEquipModule = ({ data, onSave, onDelete, onCopy, showToast }) => {
  const [form, setForm] = useState({ client: '', ip: '', serial: '', link: '', model: '', date: '' });
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => data.filter(item => item.client.toLowerCase().includes(search.toLowerCase()) || item.ip.includes(search)), [data, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20"><Cctv size={24} /></div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Inventario Hardware IP</h2>
            <p className="text-xs text-slate-400 font-medium">Control de IPs, Series y Garantías de Equipos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
          <div className="space-y-2 md:col-span-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Ubicación del Equipo</label>
             <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.client} onChange={e=>setForm({...form, client: e.target.value})} placeholder="Ej. Almacén Central - Cámara Pasillo" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Instalación</label>
             <input type="date" className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} />
          </div>
          
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección IP Local</label>
             <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500 font-mono" value={form.ip} onChange={e=>setForm({...form, ip: e.target.value})} placeholder="192.168.1.X" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo de Equipo</label>
             <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.model} onChange={e=>setForm({...form, model: e.target.value})} placeholder="DS-2CD..." />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Serie</label>
             <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500 font-mono" value={form.serial} onChange={e=>setForm({...form, serial: e.target.value})} placeholder="J1234567..." />
          </div>
          
          <div className="space-y-2 md:col-span-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enlace Web / Info QR (Opcional)</label>
             <input className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-bold outline-none focus:border-orange-500" value={form.link} onChange={e=>setForm({...form, link: e.target.value})} placeholder="https://..." />
          </div>
          
          <div className="flex items-end">
             <button type="button" onClick={() => { 
               if(!form.client) return showToast("El cliente/ubicación es obligatorio");
               onSave('cameras', 'Equipos', [form.client, form.ip, form.serial, form.link, form.model, form.date], form); 
               setForm({ client: '', ip: '', serial: '', link: '', model: '', date: '' }); 
             }} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
               <Plus size={18}/> Guardar Equipo
             </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
        <input type="text" placeholder="Buscar por cliente, ubicación o IP..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-sm font-bold outline-none focus:border-orange-500 transition-all shadow-lg shadow-slate-950/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group relative hover:border-orange-500/50 transition-all flex flex-col shadow-xl shadow-slate-950/50">
            
            <button type="button" onClick={() => onDelete('cameras', item.id, 'Equipos', item.client)} className="absolute top-5 right-5 p-2 text-slate-500 hover:text-rose-500 bg-slate-950 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-800 hover:border-rose-500/30 opacity-0 group-hover:opacity-100 z-10"><Trash2 size={16} /></button>
            
            <div className="flex items-start gap-4 mb-5 pr-10 border-b border-slate-800 pb-5">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/20"><Cctv size={20} /></div>
              <div className="min-w-0">
                <h4 className="font-black text-white text-lg italic uppercase tracking-tight truncate">{item.client}</h4>
                <span className="text-[11px] text-orange-400 font-bold uppercase tracking-widest block mt-1">{item.model || 'Cámara IP'}</span>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
              <DataRow value={item.ip} label="Dirección IP Local" icon={Server} color="orange" onCopy={onCopy} />
              <DataRow value={item.serial} label="Número de Serie" icon={Key} color="orange" onCopy={onCopy} />
              
              {(item.link || item.date) && (
                <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-3">
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1.5 w-fit">
                      <LinkIcon size={14}/> Abrir Enlace / QR Web
                    </a>
                  )}
                  {item.date && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <Calendar size={14} className="text-slate-500"/> Instalado: <span className="text-slate-200">{item.date}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ))}
        {filteredData.length === 0 && <div className="col-span-full py-12 text-center text-slate-500 text-sm font-bold">No se encontraron equipos registrados.</div>}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('personal'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('checking'); 
  const [isLoading, setIsLoading] = useState(false);
  
  // Cambiamos el nombre de la key en localStorage a kgb_v11_data para asegurar que inicie limpio
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('kgb_v11_data');
      return saved ? JSON.parse(saved) : { personal: [], clients: [], cameras: [] };
    } catch { return { personal: [], clients: [], cameras: [] }; }
  });

  const [syncQueue, setSyncQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kgb_v11_queue')) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('kgb_v11_data', JSON.stringify(data));
    localStorage.setItem('kgb_v11_queue', JSON.stringify(syncQueue));
    if (syncQueue.length > 0) processSyncQueue();
  }, [data, syncQueue]);

  const processSyncQueue = async () => {
    if (syncQueue.length === 0) return;
    const item = syncQueue[0];
    try {
      await fetch(URL_GOOGLE_SHEETS, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(item) });
      setSyncQueue(prev => prev.slice(1));
      setCloudStatus('online');
    } catch (e) {
      setCloudStatus('offline');
    }
  };

  const fetchCloudData = async () => {
    setIsLoading(true); setCloudStatus('checking');
    try {
      const response = await fetch(URL_GOOGLE_SHEETS, { method: 'GET' });
      const result = await response.json();
      if (result && !result.error) {
        setData({ 
          personal: (result.personal || data.personal).reverse(), 
          clients: (result.clients || data.clients).reverse(), 
          cameras: (result.cameras || data.cameras).reverse(),
        });
        setCloudStatus('online');
        showMsg("Datos Descargados de la Nube");
      }
    } catch (e) { 
      setCloudStatus('offline'); 
      console.log("Modo Offline Local Activo");
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchCloudData(); }, []);

  const showMsg = useCallback((text) => { setNotification(text); setTimeout(() => setNotification(null), 3000); }, []);
  const handleCopy = useCallback((val) => { navigator.clipboard.writeText(val); showMsg("Copiado al portapapeles"); }, [showMsg]);

  const handleSave = useCallback((type, sheetName, valuesForSheet, formData) => {
    const newId = "loc_" + Date.now();
    const newItem = { id: newId, ...formData, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, [type]: [newItem, ...prev[type]] }));
    setSyncQueue(prev => [...prev, { action: 'add', sheet: sheetName, values: [new Date().toLocaleString(), ...valuesForSheet] }]);
    showMsg("Registro guardado exitosamente");
  }, [showMsg]);

  const handleDelete = useCallback((type, id, sheetName, keyValue) => {
    setData(prev => ({ ...prev, [type]: prev[type].filter(x => x.id !== id) }));
    setSyncQueue(prev => [...prev, { action: 'delete', sheet: sheetName, value: keyValue }]);
    showMsg("Registro eliminado");
  }, [showMsg]);

  const TABS = [
    { id: 'personal', name: 'Banco de Correos', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-600/10 border-blue-500/20' },
    { id: 'clients', name: 'Accesos CCTV', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-600/10 border-emerald-500/20' },
    { id: 'cameras', name: 'Equipos IP', icon: Cctv, color: 'text-orange-500', bg: 'bg-orange-600/10 border-orange-500/20' },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 border border-slate-700 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl transition-all duration-300 ${notification ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle size={18} className="text-blue-400" />
        <span className="text-xs font-black uppercase tracking-widest text-white">{notification}</span>
      </div>

      {/* Mobile Top Header */}
      <div className={`lg:hidden fixed top-0 w-full h-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-40 transition-all duration-500 ${cloudStatus === 'online' ? 'border-b-emerald-500/30' : 'border-b-amber-500/30'}`}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-800 rounded-xl text-slate-300 hover:text-white border border-slate-700">
            <Menu size={22} />
          </button>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20"><ShieldCheck size={20}/></div>
          <div className="font-black text-xl italic tracking-tight text-white">Vault<span className="text-blue-500">KGB</span></div>
        </div>
      </div>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Fija a la Izquierda */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex-1 flex flex-col h-full overflow-y-auto">
          
          <button type="button" onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-6 right-6 p-2 text-slate-500 hover:text-white bg-slate-800 rounded-lg"><X size={20}/></button>

          <div className="flex items-center gap-4 mb-12 mt-2 lg:mt-0">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20"><ShieldCheck size={28}/></div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none">Vault<span className="text-blue-500">KGB</span></h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1.5">PRO SYSTEM v10.0</p>
            </div>
          </div>

          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Categorías</div>
          <nav className="space-y-2 flex-1">
            {TABS.map(t => {
              const isActive = activeTab === t.id;
              return (
                <button 
                  type="button" 
                  key={t.id} 
                  onClick={() => { setActiveTab(t.id); setIsSidebarOpen(false); }} 
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${isActive ? `${t.bg} ${t.color}` : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'}`}
                >
                  <t.icon size={20} className={isActive ? '' : 'text-slate-500'} /> 
                  {t.name}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 bg-slate-950 p-5 rounded-2xl border border-slate-800">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base de Datos</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{cloudStatus === 'online' ? 'SINC' : 'LOCAL'}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500'}`}></div>
                </div>
             </div>
             <button type="button" onClick={fetchCloudData} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50">
                <RefreshCw size={14} className={isLoading ? "animate-spin":""} /> {isLoading ? 'Actualizando...' : 'Forzar Sincronización'}
             </button>
          </div>
        </div>
      </aside>

      {/* Area Central con Fondo Dark */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#020617] pt-20 lg:pt-0 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617] pointer-events-none"></div>
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-12 z-10 relative custom-scrollbar">
          
          <header className="hidden lg:flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase flex items-center gap-4">
              {TABS.find(t=>t.id === activeTab)?.name}
            </h2>
            <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border ${cloudStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <div className={`w-2 h-2 rounded-full ${cloudStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{cloudStatus === 'online' ? 'Uplink Estable (Sheets)' : 'Modo Offline (Local)'}</span>
            </div>
          </header>

          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-5">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.5em] animate-pulse">Sincronizando Bóveda...</span>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto pb-20">
              {activeTab === 'personal' && <EmailsModule data={data.personal} onSave={handleSave} onDelete={handleDelete} onCopy={handleCopy} showToast={showMsg} />}
              {activeTab === 'clients' && <CCTVModule data={data.clients} onSave={handleSave} onDelete={handleDelete} onCopy={handleCopy} showToast={showMsg} />}
              {activeTab === 'cameras' && <IPEquipModule data={data.cameras} onSave={handleSave} onDelete={handleDelete} onCopy={handleCopy} showToast={showMsg} />}
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; border: 2px solid #020617; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}} />
    </div>
  );
}