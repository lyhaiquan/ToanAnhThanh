import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, useTheme } from './lib/store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import LessonPage from './pages/LessonPage';
import MyProgress from './pages/MyProgress';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminContent from './pages/admin/Content';
import AdminMonitor from './pages/admin/Monitor';

function RequireAuth({ children, admin }: { children: JSX.Element; admin?: boolean }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const dark = useTheme((s) => s.dark);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Home />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/lessons/:lessonId" element={<LessonPage />} />
        <Route path="/progress" element={<MyProgress />} />
      </Route>
      <Route element={<RequireAuth admin><Layout /></RequireAuth>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/content" element={<AdminContent />} />
        <Route path="/admin/monitor" element={<AdminMonitor />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
