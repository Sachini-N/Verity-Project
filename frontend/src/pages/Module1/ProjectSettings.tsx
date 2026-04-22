import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings as SettingsIcon, Github, Bell, Fingerprint } from 'lucide-react';

interface ProjectSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ProjectSettings({ isOpen = true, onClose = () => {} }: ProjectSettingsProps) {
  const { id } = useParams();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: 'Verity Web System',
      description: 'An AI-assisted project collaboration and fairness monitoring platform.',
      notifyOnCommit: true,
      notifyOnReport: true,
      repoUrl: 'https://github.com/team/verity-web',
    }
  });

  const onSave = (_data: any) => {
    alert('Aura Matrix Preferences synchronized.');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          
          {/* Intense Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 shadow-[0_0_50px_rgba(34,211,238,0.15)] rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Subtle Aura Glow behind modal content */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/10 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none" />

            {/* Header */}
            <div className="relative px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]">
                  <SettingsIcon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Workspace Matrix</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Configuration #{id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-slate-800 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-full transition-all group"
              >
                <X strokeWidth={2.5} className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Modal Body / Scrollable Content */}
            <div className="relative overflow-y-auto p-8 space-y-10 custom-scrollbar flex-1">
              <form id="settings-form" onSubmit={handleSubmit(onSave)} className="space-y-10">

                {/* Aura Intelligence Parameters */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Fingerprint className="w-4 h-4 text-cyan-400" />
                    General Axioms
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Project Identifier</label>
                      <input 
                        {...register('title', { required: 'Identifier is required' })} 
                        className="w-full bg-slate-800 border border-slate-700 text-white font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all placeholder-slate-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" 
                        placeholder="Project title" 
                      />
                      {errors.title && <p className="text-red-400 text-xs font-bold mt-2">{errors.title.message as string}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Operational Scope (Description)</label>
                      <textarea 
                        {...register('description', { required: 'Scope is required', minLength: { value: 20, message: 'Minimum 20 keystrokes required' } })} 
                        className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-mono text-sm h-28 resize-none placeholder-slate-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" 
                        placeholder="Define operational boundaries..." 
                      />
                      {errors.description && <p className="text-red-400 text-xs font-bold mt-2">{errors.description.message as string}</p>}
                    </div>
                  </div>
                </div>

                {/* Repository Connection */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Github className="w-4 h-4 text-fuchsia-400" />
                    Git Neural Link
                  </h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Upstream Repository URL</label>
                    <input
                      {...register('repoUrl', { pattern: { value: /^https?:\/\/.+/, message: 'Valid protocol required' } })}
                      className="w-full bg-slate-800 border border-slate-700 text-fuchsia-400 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400 transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      placeholder="https://github.com/org/repo"
                    />
                    {errors.repoUrl && <p className="text-red-400 text-xs font-bold mt-2">{errors.repoUrl.message as string}</p>}
                  </div>
                </div>

                {/* Notifications Engine */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    Transmission Protocols
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'notifyOnCommit', label: 'Commit Pulse', desc: 'Alert matrix upon upstream push event.' },
                      { key: 'notifyOnReport', label: 'Report Telemetry', desc: 'Enforce weekly deadline warnings.' },
                    ].map(item => (
                      <label key={item.key} className="flex relative items-center justify-between bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 cursor-pointer group transition-all overflow-hidden hover:shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                        <div className="z-10">
                          <p className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">{item.label}</p>
                          <p className="text-[10px] uppercase font-black text-slate-500 mt-1 tracking-widest">{item.desc}</p>
                        </div>
                        {/* Custom Modern Switch Indicator */}
                        <div className="relative w-11 h-6 rounded-full bg-slate-900 border border-slate-600 transition-all flex items-center shrink-0 z-10 px-1">
                          <input type="checkbox" {...register(item.key as any)} className="peer sr-only" />
                          <div className="w-4 h-4 rounded-full bg-slate-500 peer-checked:bg-cyan-400 peer-checked:translate-x-5 transition-all peer-checked:shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </form>
            </div>

            {/* Footer / Actions */}
            <div className="relative p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-xl flex justify-end gap-4 shrink-0">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
              >
                Abort
              </button>
              <button 
                form="settings-form"
                type="submit" 
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black tracking-wide rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_-3px_rgba(34,211,238,0.7)]"
              >
                Synchronize Axioms
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
