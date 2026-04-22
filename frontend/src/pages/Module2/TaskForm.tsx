import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';

export default function TaskForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const resp = await axios.post('http://localhost:5000/api/task/create', {
        projectId: id,
        title: data.title,
        description: data.description,
        assigneeEmail: data.assignee,
        priority: data.priority,
        deadline: data.deadline
      });
      if (resp.data.success) {
        navigate(`/student/projects/${id}/kanban`);
      }
    } catch (e) {
      console.error("Error creating task", e);
      alert('Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-br from-white via-white to-indigo-50/30 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-indigo-100 mt-6">
      <h2 className="text-3xl font-black tracking-tight text-slate-800 mb-6">Create New Task</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
          <input 
            {...register('title', { required: 'Task title is required' })} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none font-medium"
            placeholder="e.g. Implement Login Page UI"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.title.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
          <textarea 
            {...register('description')} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[100px] outline-none font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            placeholder="Detailed task instructions..."
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Assignee (Email)</label>
            <input 
              {...register('assignee', { 
                required: 'Assignee is required', 
                pattern: { 
                  value: /^it\d{8}@my\.sliit\.lk$/i, 
                  message: "Email must be a valid SLIIT student email (e.g. it23833098@my.sliit.lk)" 
                } 
              })} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              placeholder="itxxxxxxxx@my.sliit.lk"
            />
            {errors.assignee && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.assignee.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
            <select {...register('priority')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Deadline</label>
          <input 
            type="date"
            {...register('deadline', { 
              required: 'Deadline is required',
              validate: (val) => new Date(val).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0) || 'Deadline cannot be in the past'
            })} 
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          {errors.deadline && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.deadline.message as string}</p>}
        </div>

        <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 mt-6 disabled:opacity-50">
          {loading ? 'Saving...' : 'Create Task'}
        </button>
      </form>
    </div>
  );
}
