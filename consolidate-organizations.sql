-- Consolidate all users into Thompson's organization

-- First, let's see what we have
SELECT 
  o.id,
  o.name,
  o.slug,
  COUNT(DISTINCT om.user_id) as member_count,
  COUNT(DISTINCT cc.id) as config_count,
  COUNT(DISTINCT d.id) as domain_count
FROM organizations o
LEFT JOIN organization_members om ON om.organization_id = o.id
LEFT JOIN customer_configs cc ON cc.organization_id = o.id
LEFT JOIN domains d ON d.organization_id = o.id
GROUP BY o.id, o.name, o.slug
ORDER BY o.created_at;

-- Get the Thompson's organization ID (james.d.guy's org with the actual data)
DO $$
DECLARE
  thompson_org_id UUID;
  admin_user_id UUID;
  hello_user_id UUID;
BEGIN
  -- Get Thompson's organization (the one with the domain/config)
  SELECT id INTO thompson_org_id
  FROM organizations
  WHERE slug LIKE 'james-d-guy%';

  -- Get the other user IDs
  SELECT id INTO admin_user_id FROM auth.users WHERE email LIKE 'admin%';
  SELECT id INTO hello_user_id FROM auth.users WHERE email LIKE 'hello%';

  RAISE NOTICE 'Thompson Org ID: %', thompson_org_id;
  RAISE NOTICE 'Admin User ID: %', admin_user_id;
  RAISE NOTICE 'Hello User ID: %', hello_user_id;

  -- Move admin user to Thompson's org
  IF admin_user_id IS NOT NULL THEN
    -- Delete their empty organization membership first
    DELETE FROM organization_members 
    WHERE user_id = admin_user_id 
    AND organization_id != thompson_org_id;

    -- Add them to Thompson's org as admin
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (thompson_org_id, admin_user_id, 'admin')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  -- Move hello user to Thompson's org
  IF hello_user_id IS NOT NULL THEN
    -- Delete their empty organization membership first
    DELETE FROM organization_members 
    WHERE user_id = hello_user_id 
    AND organization_id != thompson_org_id;

    -- Add them to Thompson's org as member
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (thompson_org_id, hello_user_id, 'member')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  -- Delete the now-empty organizations
  DELETE FROM organizations 
  WHERE slug LIKE 'admin%' OR slug LIKE 'hello%';

  -- Update Thompson's org name to be more professional
  UPDATE organizations
  SET name = 'Thompson''s Parts'
  WHERE id = thompson_org_id;

END $$;

-- Verify the consolidation
SELECT 
  o.name as organization,
  u.email,
  om.role,
  om.joined_at
FROM organizations o
JOIN organization_members om ON om.organization_id = o.id
JOIN auth.users u ON u.id = om.user_id
ORDER BY om.role DESC, u.email;

-- Show organization summary
SELECT 
  o.name,
  o.slug,
  o.plan_type,
  o.seat_limit,
  COUNT(DISTINCT om.user_id) as active_members,
  (o.seat_limit - COUNT(DISTINCT om.user_id)) as available_seats,
  COUNT(DISTINCT cc.id) as customer_configs,
  COUNT(DISTINCT d.id) as domains
FROM organizations o
LEFT JOIN organization_members om ON om.organization_id = o.id
LEFT JOIN customer_configs cc ON cc.organization_id = o.id
LEFT JOIN domains d ON d.organization_id = o.id
GROUP BY o.id, o.name, o.slug, o.plan_type, o.seat_limit;
