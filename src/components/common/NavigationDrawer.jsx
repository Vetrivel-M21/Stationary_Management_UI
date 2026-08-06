import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import PostAddIcon from '@mui/icons-material/PostAdd';
import HistoryIcon from '@mui/icons-material/History';
import ApprovalIcon from '@mui/icons-material/Approval';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 260;

const NavigationDrawer = ({ open, onClose, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const role = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');

  const getMenuItems = () => {
    const items = [{ text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }];

    if (role === 'ADMIN') {
      items.push(
        { text: 'Product Catalog', icon: <InventoryIcon />, path: '/products' },
        { text: 'Branches', icon: <BusinessIcon />, path: '/branches' },
        { text: 'Users & RBAC', icon: <PeopleIcon />, path: '/users' },
        { text: 'Create New Request', icon: <PostAddIcon />, path: '/requests/new' },
        { text: 'All Requests', icon: <HistoryIcon />, path: '/requests' },
        { text: 'Order Reports', icon: <AssessmentIcon />, path: '/reports' },
        { text: 'Approvals Queue', icon: <ApprovalIcon />, path: '/approvals' },
        { text: 'Delivery Queue', icon: <LocalShippingIcon />, path: '/deliveries' },
        { text: 'Verifications', icon: <VerifiedIcon />, path: '/verification' },
        { text: 'Monitor Workflow', icon: <MonitorHeartIcon />, path: '/monitor' },
        { text: 'Audit Logs', icon: <SecurityIcon />, path: '/audit-logs' }
      );
    } else if (role === 'BRANCH_REQUESTER') {
      items.push(
        { text: 'Create New Request', icon: <PostAddIcon />, path: '/requests/new' },
        { text: 'My Requests', icon: <HistoryIcon />, path: '/requests' },
        { text: 'Order Reports', icon: <AssessmentIcon />, path: '/reports' },
        { text: 'Product Catalog', icon: <InventoryIcon />, path: '/products' },
        { text: 'Verify Deliveries', icon: <VerifiedIcon />, path: '/verification' }
      );
    } else if (role === 'APPROVER') {
      items.push(
        { text: 'Pending Approvals', icon: <ApprovalIcon />, path: '/approvals' },
        { text: 'Request History', icon: <HistoryIcon />, path: '/requests' },
        { text: 'Order Reports', icon: <AssessmentIcon />, path: '/reports' },
        { text: 'Product Catalog', icon: <InventoryIcon />, path: '/products' }
      );
    } else if (role === 'AGENCY') {
      items.push(
        { text: 'Pending Deliveries', icon: <LocalShippingIcon />, path: '/deliveries' },
        { text: 'Delivery History', icon: <HistoryIcon />, path: '/requests' },
        { text: 'Product Catalog', icon: <InventoryIcon />, path: '/products' }
      );
    } else if (role === 'MONITOR') {
      items.push(
        { text: 'Monitor Workflow', icon: <MonitorHeartIcon />, path: '/monitor' },
        { text: 'All Requests', icon: <HistoryIcon />, path: '/requests' },
        { text: 'Order Reports', icon: <AssessmentIcon />, path: '/reports' },
        { text: 'Product Catalog', icon: <InventoryIcon />, path: '/products' }
      );
    }

    return items;
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto', backgroundColor: '#2D3748', height: '100%', color: '#FFFFFF' }}>
      <Toolbar />
      <Divider sx={{ borderColor: '#4A5568' }} />
      <List sx={{ pt: 2 }}>
        {getMenuItems().map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) onClose();
                }}
                selected={selected}
                sx={{
                  py: 1.5,
                  px: 3,
                  '&.Mui-selected': {
                    backgroundColor: '#2B6CB0',
                    borderLeft: '4px solid #63B3ED',
                    color: '#FFFFFF',
                    '&:hover': { backgroundColor: '#1A4971' },
                  },
                  '&:hover': { backgroundColor: '#4A5568' },
                }}
              >
                <ListItemIcon sx={{ color: selected ? '#FFFFFF' : '#CBD5E0', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: '1rem' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        transition: (theme) => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.standard,
        }),
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default NavigationDrawer;
