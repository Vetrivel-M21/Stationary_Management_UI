import React from 'react';
import { Box, Typography, Stepper, Step, StepLabel, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = ['Requested', 'Approved', 'Delivered', 'Verified / Completed'];

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

const TimelineView = ({ status }) => {
  const activeStep = getActiveStep(status);
  const isRejected = status === 'REJECTED';

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: '#FAF5FF', border: '1px solid #E9D8FD' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#2B6CB0' }}>
        Request Workflow Status
      </Typography>
      {isRejected ? (
        <Typography variant="body1" color="error" sx={{ fontWeight: 700 }}>
          This request has been REJECTED.
        </Typography>
      ) : (
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={activeStep > index}>
              <StepLabel StepIconComponent={activeStep > index ? CheckCircleIcon : undefined}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
    </Paper>
  );
};

export default TimelineView;
