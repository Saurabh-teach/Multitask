import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskDetail();
  }, [id]);

  const fetchTaskDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/auth/tasks/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(res.data);

      const commentRes = await axios.get(`http://127.0.0.1:8000/api/auth/tasks/${id}/comments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(commentRes.data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/auth/tasks/${id}/comments/create/`, {
        comment: newComment
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setNewComment('');
      fetchTaskDetail();
    } catch (err) {
      alert("Failed to add comment");
    }
  };

  if (loading) return <div className="text-center py-20">Loading task details...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-72">
        <nav className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
            <button onClick={() => navigate('/tasks')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              ← Back to Tasks
            </button>
            <h1 className="text-xl font-semibold">{task.title}</h1>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow p-10">
              <div className="flex gap-4 mb-8">
                <span className={`px-5 py-2 rounded-2xl text-sm font-semibold ${task.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="px-5 py-2 bg-yellow-100 text-yellow-700 rounded-2xl text-sm font-semibold">
                  {task.priority.toUpperCase()}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-6">{task.title}</h1>
              {task.description && <p className="text-gray-700 text-lg leading-relaxed mb-10">{task.description}</p>}

              {/* Comments */}
              <div className="mt-12">
                <h3 className="text-2xl font-semibold mb-6">Comments ({comments.length})</h3>
                <div className="space-y-6 mb-8 max-h-96 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="w-9 h-9 bg-orange-500 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
                        {comment.user_name?.[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{comment.user_name}</p>
                          <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="text-gray-700 mt-1">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-orange-500"
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  />
                  <button
                    onClick={addComment}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-10 rounded-2xl font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow">
              <h4 className="font-semibold mb-5">Task Information</h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : 'Not Set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Hours</span>
                  <span>{task.estimated_hours || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;