import React from 'react';
import { Chip } from '@mui/material';

const statusConfig = {
  SUBMITTED: { label: 'Submitted', color: '#D69E2E', bg: '#FEFCBF' },
  APPROVED: { label: 'Approved', color: '#2B6CB0', bg: '#EBF8FF' },
  REJECTED: { label: 'Rejected', color: '#E53E3E', bg: '#FFF5F5' },
  DELIVERED: { label: 'Delivered', color: '#319795', bg: '#E6FFFA' },
  PARTIALLY_DELIVERED: { label: 'Partially Delivered', color: '#DD6B20', bg: '#FEEBC8' },
  COMPLETED: { label: 'Completed', color: '#2F855A', bg: '#F0FFF4' },
  ACTIVE: { label: 'Active', color: '#2F855A', bg: '#F0FFF4' },
  INACTIVE: { label: 'Inactive', color: '#718096', bg: '#EDF2F7' },
};

const StatusChip = ({ status }) => {
  const cfg = statusConfig[status] || { label: status, color: '#4A5568', bg: '#EDF2F7' };
  return (
    <Chip
      label={cfg.label}
      sx={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontWeight: 700,
        fontSize: '0.85rem',
        borderRadius: '6px',
        border: `1px solid ${cfg.color}33`,
      }}
      size="small"
    />
  );
};

export default StatusChip;
