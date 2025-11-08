import React, { useState, useRef } from 'react';
import {
  Box,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  IconButton,
  Avatar,
  Chip,
  Typography,
  Stack,
  alpha,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Star,
  StarBorder,
  Delete,
  Archive,
  AttachFile
} from '@mui/icons-material';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export default function SwipeableEmailItem({
  email,
  selected,
  onSelect,
  onClick,
  onStar,
  onDelete,
  onArchive,
  animationDelay = 0
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swipeThreshold = 100; // pixels needed to trigger action

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const distance = currentX.current - startX.current;
    
    // Limit swipe distance
    const maxDistance = 150;
    const limitedDistance = Math.max(-maxDistance, Math.min(maxDistance, distance));
    setSwipeDistance(limitedDistance);
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    // Trigger action if swipe threshold is met
    if (Math.abs(swipeDistance) >= swipeThreshold) {
      if (swipeDistance < 0) {
        // Swiped left - delete
        onDelete(email.id);
      } else {
        // Swiped right - archive
        onArchive && onArchive(email.id);
      }
    }
    
    // Reset
    setSwipeDistance(0);
    setIsSwiping(false);
    startX.current = 0;
    currentX.current = 0;
  };

  const formatEmailDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getSwipeActionColor = () => {
    if (swipeDistance < -swipeThreshold) return 'error.main';
    if (swipeDistance > swipeThreshold) return 'success.main';
    if (swipeDistance < 0) return 'error.light';
    if (swipeDistance > 0) return 'success.light';
    return 'transparent';
  };

  const getSwipeActionIcon = () => {
    if (Math.abs(swipeDistance) < swipeThreshold) return null;
    if (swipeDistance < 0) return <Delete />;
    if (swipeDistance > 0) return <Archive />;
    return null;
  };

  return (
    <Fade in timeout={300} style={{ transitionDelay: `${animationDelay}ms` }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          mb: 0.5,
          borderRadius: 1,
          transition: 'all 0.2s ease-out'
        }}
      >
        {/* Swipe action background */}
        {isMobile && swipeDistance !== 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: swipeDistance > 0 ? 0 : 'auto',
              right: swipeDistance < 0 ? 0 : 'auto',
              bottom: 0,
              width: Math.abs(swipeDistance),
              bgcolor: getSwipeActionColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: swipeDistance > 0 ? 'flex-start' : 'flex-end',
              px: 2,
              color: 'white',
              transition: 'background-color 0.2s ease'
            }}
          >
            {getSwipeActionIcon()}
          </Box>
        )}

        {/* Email item */}
        <ListItem
          disablePadding
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          sx={{
            transform: `translateX(${swipeDistance}px)`,
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }
          }}
        >
          <ListItemButton
            selected={selected}
            onClick={() => onClick(email.id)}
            sx={{
              py: { xs: 2, sm: 1.5 },
              px: { xs: 1.5, sm: 2 },
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'transparent'
              }
            }}
          >
            {/* Checkbox */}
            <Checkbox
              checked={selected}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(email.id);
              }}
              sx={{ 
                p: { xs: 1, sm: 0.5 },
                mr: { xs: 1, sm: 1 }
              }}
            />

            {/* Avatar */}
            <Avatar
              sx={{
                width: { xs: 40, sm: 32 },
                height: { xs: 40, sm: 32 },
                bgcolor: email.from?.color || 'primary.main',
                fontSize: { xs: '1rem', sm: '0.875rem' },
                mr: { xs: 1.5, sm: 2 }
              }}
            >
              {email.from?.name?.charAt(0) || email.from?.email?.charAt(0) || '?'}
            </Avatar>

            {/* Email content */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1}
                sx={{ mb: 0.5 }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: email.isRead ? 400 : 700,
                    color: email.isRead ? 'text.secondary' : 'text.primary',
                    fontSize: { xs: '0.9375rem', sm: '0.875rem' }
                  }}
                  noWrap
                >
                  {email.from?.name || email.from?.email}
                </Typography>
                {email.attachments?.length > 0 && (
                  <AttachFile sx={{ fontSize: { xs: 18, sm: 16 }, color: 'text.secondary' }} />
                )}
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: email.isRead ? 400 : 600,
                  color: email.isRead ? 'text.secondary' : 'text.primary',
                  mb: 0.25,
                  fontSize: { xs: '0.875rem', sm: '0.8125rem' }
                }}
                noWrap
              >
                {email.subject || '(No Subject)'}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ 
                  display: 'block',
                  fontSize: { xs: '0.8125rem', sm: '0.75rem' }
                }}
              >
                {email.preview || 'No preview available'}
              </Typography>
            </Box>

            {/* Right side - Date and actions */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-end', sm: 'center' }}
              spacing={{ xs: 1, sm: 1 }}
              sx={{ ml: { xs: 1, sm: 2 } }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ 
                  minWidth: { xs: 60, sm: 70 },
                  textAlign: 'right',
                  fontSize: { xs: '0.75rem', sm: '0.6875rem' }
                }}
              >
                {formatEmailDate(email.createdAt)}
              </Typography>

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStar(email.id);
                  }}
                  sx={{ 
                    p: { xs: 0.75, sm: 0.5 },
                    '&:hover': {
                      bgcolor: 'transparent',
                      '& svg': {
                        transform: 'scale(1.1)'
                      }
                    }
                  }}
                >
                  {email.isStarred ? (
                    <Star sx={{ fontSize: { xs: 20, sm: 18 }, color: '#ffc107' }} />
                  ) : (
                    <StarBorder sx={{ fontSize: { xs: 20, sm: 18 } }} />
                  )}
                </IconButton>

                {!isMobile && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(email.id);
                    }}
                    sx={{ 
                      p: 0.5,
                      display: { xs: 'none', sm: 'inline-flex' }
                    }}
                  >
                    <Delete sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </ListItemButton>
        </ListItem>
      </Box>
    </Fade>
  );
}
