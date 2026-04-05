import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Layouts
import StudentLayout from './components/layout/StudentLayout';
import LecturerLayout from './components/layout/LecturerLayout';
import ManagerLayout from './components/layout/ManagerLayout';

// Module 1
import ProjectList from './pages/Module1/ProjectList';
import ProjectCreateForm from './pages/Module1/ProjectCreateForm';
import ProjectSettings from './pages/Module1/ProjectSettings';
import TeamManagement from './pages/Module1/TeamManagement';
import AnnouncementBoard from './pages/Module1/AnnouncementBoard';
import LecturerDashboard from './pages/Module1/LecturerDashboard';
import StudentProjectDashboard from './pages/Module1/StudentProjectDashboard';
import StudentProjectOverview from './pages/Module1/StudentProjectOverview';
import StudentGlobalAssignments from './pages/Module1/StudentGlobalAssignments';
import StudentCalendar from './pages/Module1/StudentCalendar';
import StudentProfile from './pages/StudentProfile';

// Module 2
import TaskForm from './pages/Module2/TaskForm';
import KanbanBoard from './pages/Module2/KanbanBoard';
import SprintPlanner from './pages/Module2/SprintPlanner';
import TimeTracker from './pages/Module2/TimeTracker';

// Module 3
import WeeklyReport from './pages/Module3/WeeklyReport';
import EngagementDashboard from './pages/Module3/EngagementDashboard';
import FairnessAnalytics from './pages/Module3/FairnessAnalytics';
import LecturerReview from './pages/Module3/LecturerReview';
import ContributionTable from './pages/Module3/ContributionTable';
import LecturerGroupList from './pages/Module3/LecturerGroupList';
import LecturerGroupDashboard from './pages/Module3/LecturerGroupDashboard';
import LecturerAssignments from './pages/Module3/LecturerAssignments';
import GroupIntelligenceOverview from './pages/Module3/GroupIntelligenceOverview';
import LecturerGroupMembers from './pages/Module3/LecturerGroupMembers';
import LecturerProfile from './pages/LecturerProfile';

// Module 4
import GithubIntegration from './pages/Module4/GithubIntegration';
import BranchActivity from './pages/Module4/BranchActivity';
import FileManager from './pages/Module4/FileManager';
import VersionHistory from './pages/Module4/VersionHistory';
import FileComments from './pages/Module4/FileComments';
import SubmissionStation from './pages/Module4/SubmissionStation';
import SubmissionReview from './pages/Module4/SubmissionReview';

// Manager Portal
import ApprovalDashboard from './pages/Manager/ApprovalDashboard';
import ManagerUserDirectory from './pages/Manager/ManagerUserDirectory';
import ManagerGroupDirectory from './pages/Manager/ManagerGroupDirectory';
import ManagerSystemSettings from './pages/Manager/ManagerSystemSettings';
import ManagerModules from './pages/Manager/ManagerModules';

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public Routes ─────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── STUDENT PORTAL (/student/*) ───────────────────────────── */}
        <Route path="/student" element={<StudentLayout />}>
          {/* Main List */}
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/new" element={<ProjectCreateForm />} />
          <Route path="assignments" element={<StudentGlobalAssignments />} />
          <Route path="calendar" element={<StudentCalendar />} />
          <Route path="profile" element={<StudentProfile />} />

          {/* Unified Project Dashboard */}
          <Route path="projects/:id" element={<StudentProjectDashboard />}>
            <Route index element={<StudentProjectOverview />} />
            
            {/* General Project Settings & Announcements */}
            <Route path="settings" element={<ProjectSettings />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="announcements" element={<AnnouncementBoard />} />

            {/* Task Management */}
            <Route path="tasks/new" element={<TaskForm />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="sprints" element={<SprintPlanner />} />
            <Route path="time" element={<TimeTracker />} />

            {/* Student Reviews & Reports */}
            <Route path="reports/weekly" element={<WeeklyReport />} />
            <Route path="analytics/engagement" element={<EngagementDashboard />} />
            <Route path="analytics/contribution" element={<FairnessAnalytics />} />
            <Route path="analytics/comparison" element={<ContributionTable />} />

            {/* Files & Integrations */}
            <Route path="github" element={<GithubIntegration />} />
            <Route path="github/branches" element={<BranchActivity />} />
            <Route path="files" element={<FileManager />} />
            <Route path="files/:filename/history" element={<VersionHistory />} />
            <Route path="files/:filename/comments" element={<FileComments />} />
            <Route path="submissions" element={<SubmissionStation />} />
          </Route>

          {/* Default student page */}
          <Route index element={<Navigate to="projects" replace />} />
        </Route>

        {/* ── LECTURER PORTAL (/lecturer/*) ─────────────────────────── */}
        <Route path="/lecturer" element={<LecturerLayout />}>
          <Route path="dashboard" element={<LecturerDashboard />} />
          <Route path="assignments" element={<LecturerAssignments />} />
          <Route path="profile" element={<LecturerProfile />} />
          
          {/* Main Lecturer Group List View */}
          <Route path="projects" element={<LecturerGroupList />} />

          {/* Unified Group Dashboard (Nested routing for tabs) */}
          <Route path="projects/:id" element={<LecturerGroupDashboard />}>
             {/* General metrics view */}
             <Route index element={<GroupIntelligenceOverview />} />
             
             {/* The Review Tabs */}
             <Route path="members" element={<LecturerGroupMembers />} />
             <Route path="reports" element={<LecturerReview />} />
             <Route path="fairness" element={<FairnessAnalytics />} />
             <Route path="engagement" element={<EngagementDashboard />} />
             <Route path="github" element={<GithubIntegration />} />
             <Route path="submissions/review" element={<SubmissionReview />} />
          </Route>

          {/* Default lecturer page overrides */}
          <Route index element={<Navigate to="projects" replace />} />
        </Route>

        {/* ── MANAGER (ADMIN) PORTAL (/manager/*) ───────────────────── */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route path="approvals" element={<ApprovalDashboard />} />
          <Route path="users" element={<ManagerUserDirectory />} />
          <Route path="groups" element={<ManagerGroupDirectory />} />
          <Route path="modules" element={<ManagerModules />} />
          <Route path="settings" element={<ManagerSystemSettings />} />
          
          <Route index element={<Navigate to="approvals" replace />} />
        </Route>

        {/* ── Legacy redirect & 404 ─────────────────────────────────── */}
        <Route path="/dashboard" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
