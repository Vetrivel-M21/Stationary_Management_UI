import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, CircularProgress, Button } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import BlockIcon from '@mui/icons-material/Block';
import AddIcon from '@mui/icons-material/Add';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { requestService } from '../services/requestService';
import SettingsIcon from '@mui/icons-material/Settings';
import SlaSettingsModal from '../components/common/SlaSettingsModal';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#2F855A', '#DD6B20', '#3182CE', '#E53E3E', '#4A5568'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const [metrics, setMetrics] = useState(null);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slaModalOpen, setSlaModalOpen] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [metricsRes, reqsRes] = await Promise.allSettled([
        requestService.getDashboardMetrics(),
        requestService.getRequests('', 1, 200),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.success) {
        setMetrics(metricsRes.value.data);
      }

      if (reqsRes.status === 'fulfilled' && reqsRes.value?.success) {
        const reqList = reqsRes.value.data.requests || [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyCounts = {};

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthlyCounts[monthNames[d.getMonth()]] = 0;
        }

        reqList.forEach((req) => {
          const dateStr = req.submittedAt || req.createdAt;
          if (dateStr) {
            const dateObj = new Date(dateStr);
            const mName = monthNames[dateObj.getMonth()];
            if (monthlyCounts[mName] !== undefined) {
              monthlyCounts[mName] += 1;
            }
          }
        });

        const chartData = Object.keys(monthlyCounts).map((m) => ({
          name: m,
          requests: monthlyCounts[m],
        }));

        setMonthlyTrendData(chartData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const cards = [
    { title: 'Total Products', value: metrics?.totalProducts || 0, icon: <InventoryIcon sx={{ fontSize: 36, color: '#2B6CB0' }} />, color: '#EBF8FF' },
    { title: 'Total Requests', value: metrics?.totalRequests || 0, icon: <AssignmentIcon sx={{ fontSize: 36, color: '#4A5568' }} />, color: '#EDF2F7' },
    { title: 'Pending Approvals', value: metrics?.pendingApprovals || 0, icon: <PendingActionsIcon sx={{ fontSize: 36, color: '#DD6B20' }} />, color: '#FEEBC8' },
    { title: 'Pending Deliveries', value: metrics?.pendingDeliveries || 0, icon: <LocalShippingIcon sx={{ fontSize: 36, color: '#3182CE' }} />, color: '#EBF8FF' },
    { title: 'Completed Requests', value: metrics?.completed || 0, icon: <CheckCircleIcon sx={{ fontSize: 36, color: '#2F855A' }} />, color: '#F0FFF4' },
    { title: 'Rejected Requests', value: metrics?.rejected || 0, icon: <CancelIcon sx={{ fontSize: 36, color: '#E53E3E' }} />, color: '#FFF5F5' },
    { title: 'Delayed Requests', value: metrics?.delayed || 0, icon: <AccessTimeIcon sx={{ fontSize: 36, color: '#D69E2E' }} />, color: '#FEFCBF' },
    { title: 'Damaged Items', value: metrics?.damagedItems || 0, icon: <ReportProblemIcon sx={{ fontSize: 36, color: '#C53030' }} />, color: '#FFF5F5' },
    { title: 'Unavailable Items', value: metrics?.unavailableItems || 0, icon: <BlockIcon sx={{ fontSize: 36, color: '#742A2A' }} />, color: '#FFF5F5' },
  ];

  const pieData = [
    { name: 'Completed', value: metrics?.completed || 0 },
    { name: 'Pending Approval', value: metrics?.pendingApprovals || 0 },
    { name: 'Pending Delivery', value: metrics?.pendingDeliveries || 0 },
    { name: 'Rejected', value: metrics?.rejected || 0 },
  ].filter((item) => item.value > 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A202C' }}>
          Executive Management Dashboard
        </Typography>

        {/* Quick Actions Bar based on Role */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {role === 'ADMIN' && (
            <>
              <Button variant="contained" startIcon={<PostAddIcon />} onClick={() => navigate('/requests/new')} sx={{ backgroundColor: '#2B6CB0' }}>
                New Request
              </Button>
              <Button variant="contained" startIcon={<SettingsIcon />} onClick={() => setSlaModalOpen(true)} sx={{ backgroundColor: '#D69E2E' }}>
                SLA Settings
              </Button>
              <Button variant="contained" startIcon={<InventoryIcon />} onClick={() => navigate('/products')} sx={{ backgroundColor: '#2D3748' }}>
                Add / Manage Products
              </Button>
              <Button variant="contained" startIcon={<PeopleIcon />} onClick={() => navigate('/users')} sx={{ backgroundColor: '#2D3748' }}>
                Users & RBAC
              </Button>
              <Button variant="outlined" startIcon={<BusinessIcon />} onClick={() => navigate('/branches')}>
                Branches
              </Button>
              <Button variant="outlined" startIcon={<MonitorHeartIcon />} onClick={() => navigate('/monitor')}>
                Monitor
              </Button>
            </>
          )}

          {role === 'BRANCH_REQUESTER' && (
            <>
              <Button variant="contained" startIcon={<PostAddIcon />} onClick={() => navigate('/requests/new')} sx={{ backgroundColor: '#2B6CB0' }}>
                Create New Request
              </Button>
              <Button variant="contained" startIcon={<InventoryIcon />} onClick={() => navigate('/products')} sx={{ backgroundColor: '#2D3748' }}>
                View Catalog
              </Button>
            </>
          )}

          {role === 'APPROVER' && (
            <>
              <Button variant="contained" startIcon={<PendingActionsIcon />} onClick={() => navigate('/approvals')} sx={{ backgroundColor: '#DD6B20' }}>
                Pending Approvals
              </Button>
              <Button variant="outlined" startIcon={<InventoryIcon />} onClick={() => navigate('/products')}>
                Product Catalog
              </Button>
            </>
          )}

          {role === 'AGENCY' && (
            <>
              <Button variant="contained" startIcon={<LocalShippingIcon />} onClick={() => navigate('/deliveries')} sx={{ backgroundColor: '#3182CE' }}>
                Pending Deliveries
              </Button>
              <Button variant="outlined" startIcon={<InventoryIcon />} onClick={() => navigate('/products')}>
                Product Catalog
              </Button>
            </>
          )}

          {role === 'MONITOR' && (
            <>
              <Button variant="contained" startIcon={<MonitorHeartIcon />} onClick={() => navigate('/monitor')} sx={{ backgroundColor: '#2F855A' }}>
                Monitor Workflow
              </Button>
              <Button variant="outlined" startIcon={<InventoryIcon />} onClick={() => navigate('/products')}>
                Product Catalog
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={4} key={idx}>
            <Card sx={{ backgroundColor: card.color, border: '1px solid #CBD5E0', height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#4A5568', fontWeight: 600, mb: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#1A202C' }}>
                    {card.value}
                  </Typography>
                </Box>
                {card.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1A202C' }}>
              Monthly Request Volume Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="requests" fill="#2B6CB0" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1A202C' }}>
              Request Status Distribution
            </Typography>
            {pieData.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                <Typography color="text.secondary">No request status data recorded yet.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <SlaSettingsModal
        open={slaModalOpen}
        onClose={() => setSlaModalOpen(false)}
      />
    </Box>
  );
};

export default Dashboard;
