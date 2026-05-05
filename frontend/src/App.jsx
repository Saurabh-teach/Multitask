import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';

import Dashboard from './pages/dashboard/Dashboard';
import Goals from './pages/goals/Goals';
import Tasks from './pages/tasks/Tasks';
import ResourceManagement from './pages/members/ResourceManagement';
import Chat from './pages/chat/Chat';
import TalentPool from './pages/members/TalentPool';
import InviteMember from './pages/members/InviteMember';
import Organizations from './pages/organizations/Organizations';
import CreateOrganization from './pages/organizations/CreateOrganization';
import CreateGoal from './pages/goals/CreateGoal';
import GoalDetail from './pages/goals/GoalDetail';
import CreateTask from './pages/tasks/CreateTask';
import TaskDetail from './pages/tasks/TaskDetail';
import Settings from './pages/settings/Settings';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/members" element={<ResourceManagement />} />
          <Route path="/chat/:orgId" element={<Chat />} />
          <Route path="/chat/:orgId/:roomId" element={<Chat />} />
          <Route path="/talent-pool" element={<TalentPool />} />
          <Route path="/members/invite" element={<InviteMember />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/organizations/create" element={<CreateOrganization />} />
          <Route path="/goals/create" element={<CreateGoal />} />
          <Route path="/goals/:goalId" element={<GoalDetail />} />
          <Route path="/tasks/create" element={<CreateTask />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;