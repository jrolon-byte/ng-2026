-- Migration 010: Add message prefix/suffix to organizations
ALTER TABLE organizations ADD COLUMN message_prefix text;
ALTER TABLE organizations ADD COLUMN message_suffix text;

-- Set Tony Touch's branding (matching legacy system)
UPDATE organizations SET
  message_prefix = 'TonyTouchBarberShop: ',
  message_suffix = ' -- Call Now: 407-452-4314'
WHERE slug = 'tonytouch';

-- Set Geny Barber's branding
UPDATE organizations SET
  message_prefix = 'GenyBarberShop: ',
  message_suffix = ' -- Call Now: 407-288-4970'
WHERE slug = 'genybarber';
