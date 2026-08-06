import React from 'react';
import { Box, Typography, Stepper, Step, StepLabel, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { formatDateTime } from '../../utils/formatters';

const steps = [
  { label: 'Requested' },
  { label: 'Approved' },
  { label: 'Delivered' },
  { label: 'Verified / Completed' },
];

const getActiveStep = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return 0;
    case 'APPROVED':
      return 1;
    case 'DELIVERED':
    case 'PARTIALLY_DELIVERED':
      return 2;
    case 'COMPLETED':
      return 4;
    default:
      return 0;
  }
};

const TimelineView = ({ status, request }) => {
  const currentStatus = status || request?.status;
  const activeStep = getActiveStep(currentStatus);
  const isRejected = currentStatus === 'REJECTED';

  const getStepDate = (index) => {
    if (!request) return null;

    switch (index) {
      case 0: { // Requested
        const dateVal = request.submittedAt || request.createdAt;
        return dateVal ? formatDateTime(dateVal) : null;
      }
      case 1: { // Approved
        return request.approvedAt ? formatDateTime(request.approvedAt) : null;
      }
      case 2: { // Delivered
        const deliveries = request.deliveries || [];
        const lastDelivery = deliveries.length > 0 ? deliveries[deliveries.length - 1] : null;
        const dateVal = lastDelivery?.deliveredDate || lastDelivery?.createdAt;
        return dateVal ? formatDateTime(dateVal) : null;
      }
      case 3: { // Verified / Completed
        return request.completedAt ? formatDateTime(request.completedAt) : null;
      }
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: '#FAF5FF', border: '1px solid #E9D8FD', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: '#2B6CB0' }}>
        Request Workflow Status & Timeline
      </Typography>
      {isRejected ? (
        <Box sx={{ p: 2, backgroundColor: '#FFF5F5', borderRadius: 1, border: '1px solid #FEB2B2' }}>
          <Typography variant="body1" color="error" sx={{ fontWeight: 700 }}>
            This request has been REJECTED.
          </Typography>
          {request?.approvedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
              Rejected Date & Time: <strong>{formatDateTime(request.approvedAt)}</strong>
            </Typography>
          )}
        </Box>
      ) : (
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => {
            const stepDate = getStepDate(index);
            const isCompletedOrCurrent = activeStep >= index;
            return (
              <Step key={step.label} completed={activeStep > index}>
                <StepLabel StepIconComponent={activeStep > index ? CheckCircleIcon : undefined}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: isCompletedOrCurrent ? '#1A202C' : '#A0AEC0',
                    }}
                  >
                    {step.label}
                  </Typography>
                  {stepDate ? (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: activeStep > index ? '#2F855A' : activeStep === index ? '#2B6CB0' : '#718096',
                        fontWeight: 700,
                        mt: 0.5,
                        fontSize: '0.75rem',
                      }}
                    >
                      {stepDate}
                    </Typography>
                  ) : isCompletedOrCurrent && activeStep === index ? (
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: '#D69E2E', fontWeight: 600, mt: 0.5, fontSize: '0.75rem' }}
                    >
                      In Progress
                    </Typography>
                  ) : null}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      )}
    </Paper>
  );
};

export default TimelineView;

