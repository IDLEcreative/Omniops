-- Fix widget table RLS policies
-- The original migration had incorrect policies referencing a 'domain' column that doesn't exist
-- Widget tables use customer_config_id foreign key, not domain column

-- =============================================================================
-- PART 1: Fix widget_configs RLS policies
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_configs') THEN
    -- Drop incorrect policies from the previous migration
    DROP POLICY IF EXISTS "Service role can manage widget configs" ON public.widget_configs;
    DROP POLICY IF EXISTS "Users can view their organization widget configs" ON public.widget_configs;
    DROP POLICY IF EXISTS "Users can update their organization widget configs" ON public.widget_configs;

    -- Ensure RLS is enabled
    ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;

    -- Create correct policies using customer_config_id
    CREATE POLICY "Service role can manage widget configs"
    ON public.widget_configs
    FOR ALL
    USING (auth.role() = 'service_role');

    CREATE POLICY "Users can view their organization widget configs"
    ON public.widget_configs
    FOR SELECT
    USING (
      auth.role() = 'authenticated' AND
      customer_config_id IN (
        SELECT id FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );

    CREATE POLICY "Users can update their organization widget configs"
    ON public.widget_configs
    FOR UPDATE
    USING (
      auth.role() = 'authenticated' AND
      customer_config_id IN (
        SELECT id FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );

    CREATE POLICY "Users can insert widget configs for their organization"
    ON public.widget_configs
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated' AND
      customer_config_id IN (
        SELECT id FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );

    CREATE POLICY "Users can delete their organization widget configs"
    ON public.widget_configs
    FOR DELETE
    USING (
      auth.role() = 'authenticated' AND
      customer_config_id IN (
        SELECT id FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );

    RAISE NOTICE 'Fixed RLS policies for widget_configs';
  END IF;
END $$;

-- =============================================================================
-- PART 2: Fix widget_config_history RLS policies
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_config_history') THEN
    -- Drop incorrect policies from the previous migration
    DROP POLICY IF EXISTS "Service role can manage widget config history" ON public.widget_config_history;
    DROP POLICY IF EXISTS "Users can view their organization widget history" ON public.widget_config_history;

    -- Ensure RLS is enabled
    ALTER TABLE public.widget_config_history ENABLE ROW LEVEL SECURITY;

    -- Create correct policies using widget_config_id join
    CREATE POLICY "Service role can manage widget config history"
    ON public.widget_config_history
    FOR ALL
    USING (auth.role() = 'service_role');

    CREATE POLICY "Users can view their organization widget history"
    ON public.widget_config_history
    FOR SELECT
    USING (
      auth.role() = 'authenticated' AND
      widget_config_id IN (
        SELECT id FROM public.widget_configs
        WHERE customer_config_id IN (
          SELECT id FROM public.customer_configs
          WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        )
      )
    );

    CREATE POLICY "Users can insert widget history for their organization"
    ON public.widget_config_history
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated' AND
      widget_config_id IN (
        SELECT id FROM public.widget_configs
        WHERE customer_config_id IN (
          SELECT id FROM public.customer_configs
          WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        )
      )
    );

    RAISE NOTICE 'Fixed RLS policies for widget_config_history';
  END IF;
END $$;

-- =============================================================================
-- PART 3: Fix widget_config_variants RLS policies
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_config_variants') THEN
    -- Drop incorrect policies from the previous migration
    DROP POLICY IF EXISTS "Service role can manage widget config variants" ON public.widget_config_variants;
    DROP POLICY IF EXISTS "Users can view their organization widget variants" ON public.widget_config_variants;
    DROP POLICY IF EXISTS "Users can manage their organization widget variants" ON public.widget_config_variants;

    -- Ensure RLS is enabled
    ALTER TABLE public.widget_config_variants ENABLE ROW LEVEL SECURITY;

    -- Create correct policies using widget_config_id join
    CREATE POLICY "Service role can manage widget config variants"
    ON public.widget_config_variants
    FOR ALL
    USING (auth.role() = 'service_role');

    CREATE POLICY "Users can view their organization widget variants"
    ON public.widget_config_variants
    FOR SELECT
    USING (
      auth.role() = 'authenticated' AND
      widget_config_id IN (
        SELECT id FROM public.widget_configs
        WHERE customer_config_id IN (
          SELECT id FROM public.customer_configs
          WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        )
      )
    );

    CREATE POLICY "Users can insert widget variants for their organization"
    ON public.widget_config_variants
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated' AND
      widget_config_id IN (
        SELECT id FROM public.widget_configs
        WHERE customer_config_id IN (
          SELECT id FROM public.customer_configs
          WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        )
      )
    );

    CREATE POLICY "Users can update their organization widget variants"
    ON public.widget_config_variants
    FOR UPDATE
    USING (
      auth.role() = 'authenticated' AND
      widget_config_id IN (
        SELECT id FROM public.widget_configs
        WHERE customer_config_id IN (
          SELECT id FROM public.customer_configs
          WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        )
      )
    );

    CREATE POLICY "Users can delete their organization widget variants"
    ON public.widget_config_variants
    FOR DELETE
    USING (
      auth.role() = 'authenticated' AND
      widget_config_id IN (
        SELECT id FROM public.widget_configs
        WHERE customer_config_id IN (
          SELECT id FROM public.customer_configs
          WHERE organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
        )
      )
    );

    RAISE NOTICE 'Fixed RLS policies for widget_config_variants';
  END IF;
END $$;

-- =============================================================================
-- PART 4: Add documentation comments
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_configs') THEN
    COMMENT ON TABLE public.widget_configs IS
    'Widget configurations for multi-tenant chat widget. RLS enabled - users can only access configs for customer_configs in their organization.';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_config_history') THEN
    COMMENT ON TABLE public.widget_config_history IS
    'Version history for widget configurations. RLS enabled - users can only view history for widget_configs in their organization.';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_config_variants') THEN
    COMMENT ON TABLE public.widget_config_variants IS
    'A/B testing variants for widget configurations. RLS enabled - users can manage variants for widget_configs in their organization.';
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  widget_configs_rls BOOLEAN;
  widget_history_rls BOOLEAN;
  widget_variants_rls BOOLEAN;
  widget_configs_policies INTEGER;
  widget_history_policies INTEGER;
  widget_variants_policies INTEGER;
BEGIN
  -- Check RLS status
  SELECT c.relrowsecurity INTO widget_configs_rls
  FROM pg_class c
  WHERE c.relname = 'widget_configs' AND c.relnamespace = 'public'::regnamespace;

  SELECT c.relrowsecurity INTO widget_history_rls
  FROM pg_class c
  WHERE c.relname = 'widget_config_history' AND c.relnamespace = 'public'::regnamespace;

  SELECT c.relrowsecurity INTO widget_variants_rls
  FROM pg_class c
  WHERE c.relname = 'widget_config_variants' AND c.relnamespace = 'public'::regnamespace;

  -- Count policies
  SELECT COUNT(*) INTO widget_configs_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'widget_configs';

  SELECT COUNT(*) INTO widget_history_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'widget_config_history';

  SELECT COUNT(*) INTO widget_variants_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'widget_config_variants';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  Widget Tables RLS Policy Fix Complete';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'widget_configs:';
  RAISE NOTICE '  - RLS Enabled: %', COALESCE(widget_configs_rls::text, 'table not found');
  RAISE NOTICE '  - Policies Created: %', COALESCE(widget_configs_policies::text, '0');
  RAISE NOTICE '';
  RAISE NOTICE 'widget_config_history:';
  RAISE NOTICE '  - RLS Enabled: %', COALESCE(widget_history_rls::text, 'table not found');
  RAISE NOTICE '  - Policies Created: %', COALESCE(widget_history_policies::text, '0');
  RAISE NOTICE '';
  RAISE NOTICE 'widget_config_variants:';
  RAISE NOTICE '  - RLS Enabled: %', COALESCE(widget_variants_rls::text, 'table not found');
  RAISE NOTICE '  - Policies Created: %', COALESCE(widget_variants_policies::text, '0');
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
