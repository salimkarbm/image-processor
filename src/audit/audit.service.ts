import { auditRepo } from '../repositories';
import { events } from '../libs/event';

export const auditEvents = events;

// Prevent memory leak warning for high traffic
// auditEvents.setMaxListeners(10);

auditEvents.on('audit', async (data) => {
  try {
    auditRepo.create(data);
    await auditRepo.save(data);
  } catch (err) {
    console.error('Audit write failed', err);
  }
});

auditEvents.on('audit', (data) => {
  // Can have multiple listeners
  if (data.action === 'USER_DELETED') {
    // alertSecurityTeam(data);
  }
});

auditEvents.on('error', (err) => {
  console.error('Audit emitter error', err);
});
