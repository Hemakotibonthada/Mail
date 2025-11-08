import React from 'react';
import { Box, Paper, Skeleton, Stack } from '@mui/material';

export default function EmailSkeleton({ count = 5 }) {
  return (
    <Box>
      {[...Array(count)].map((_, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 2,
            mb: 0,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            {/* Checkbox */}
            <Skeleton variant="rectangular" width={20} height={20} />
            
            {/* Star */}
            <Skeleton variant="rectangular" width={20} height={20} />
            
            {/* Email Content */}
            <Box flexGrow={1}>
              <Stack spacing={0.5}>
                {/* Sender and Date */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Skeleton variant="text" width="30%" height={20} />
                  <Skeleton variant="text" width="10%" height={16} />
                </Box>
                
                {/* Subject */}
                <Skeleton variant="text" width="60%" height={18} />
                
                {/* Preview */}
                <Skeleton variant="text" width="80%" height={16} />
              </Stack>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
