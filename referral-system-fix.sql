-- ==========================================
-- MATRIX REFERRAL SYSTEM FIX SCRIPT
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create/Update Referral Tracking Signup Handler
-- This ensures a record is created in referral_tracking when a user signs up with a code
CREATE OR REPLACE FUNCTION public.handle_referral_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the tracking entry
  INSERT INTO public.referral_tracking (
    referrer_id, 
    referred_user_id, 
    referral_code_used,
    signup_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.referrer_id, 
    NEW.referred_user_id, 
    NEW.referral_code,
    true,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  
  -- Update total_referred count in referrals table
  UPDATE public.referrals
  SET total_referred = total_referred + 1,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = NEW.referrer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger for referral signup
DROP TRIGGER IF EXISTS on_referral_signup ON public.referral_code_usage;
CREATE TRIGGER on_referral_signup
AFTER INSERT ON public.referral_code_usage
FOR EACH ROW EXECUTE FUNCTION public.handle_referral_signup();


-- 2. Update KYC Completion Trigger
CREATE OR REPLACE FUNCTION public.check_referral_kyc_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Update referral_tracking when KYC is completed
  UPDATE public.referral_tracking rt
  SET
    kyc_completed = true,
    kyc_completed_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE rt.referred_user_id = NEW.id
    AND rt.kyc_completed = false
    AND NEW.kyc_verified = true
  RETURNING rt.referrer_id INTO v_referrer_id;

  -- Send notification to referrer if KYC completed
  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, title, message, type, category, is_read, related_id, related_type, created_at
    ) VALUES (
      v_referrer_id,
      'Referral Update ✓',
      'One of your referrals completed KYC verification!',
      'referral',
      'referral',
      false,
      NEW.id,
      'referral',
      timezone('utc'::text, now())
    );
  END IF;

  RETURN NEW;
END;
$function$;


-- 3. Update Wallet Funding Trigger (Lowered threshold to ₦100)
CREATE OR REPLACE FUNCTION public.check_referral_wallet_funded()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  referrer_id uuid;
BEGIN
  -- Update referral_tracking when wallet is funded with >= 100 (Changed from 1000)
  UPDATE public.referral_tracking
  SET
    wallet_funded = true,
    wallet_funded_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE referred_user_id = NEW.user_id
    AND wallet_funded = false
    AND NEW.amount >= 100
  RETURNING referrer_id INTO referrer_id;
  
  -- Notification for referred user
  INSERT INTO public.notifications (user_id, title, message, type, category, is_read, related_id, related_type, created_at)
  VALUES (
    NEW.user_id,
    'Referral Progress 💰',
    'Your wallet funding was recorded! Complete a transaction to finalize your referral.',
    'referral',
    'referral',
    false,
    NEW.user_id,
    'referral',
    timezone('utc'::text, now())
  );
  
  -- Notification for referrer
  IF referrer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, category, is_read, related_id, related_type, created_at)
    VALUES (
      referrer_id,
      'Referral Update 💰',
      'One of your referrals funded their wallet! Waiting for first transaction.',
      'referral',
      'referral',
      false,
      referrer_id,
      'referral',
      timezone('utc'::text, now())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;


-- 4. Update First Transaction Trigger (Added support for 'successful' status)
CREATE OR REPLACE FUNCTION public.check_referral_first_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  referrer_id uuid;
  current_completed integer;
  current_tier integer;
  new_tier integer;
  new_badge text;
  tier_completed_now boolean;
BEGIN
  -- Support both 'completed' and 'successful' statuses
  IF NEW.status IN ('completed', 'successful') THEN
    -- Get referrer_id and update referral_tracking
    UPDATE public.referral_tracking
    SET
      first_transaction_completed = true,
      first_transaction_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
    WHERE referred_user_id = NEW.user_id
      AND first_transaction_completed = false
    RETURNING referrer_id INTO referrer_id;
    
    -- If this was the first transaction for a referred user, mark as counted
    IF referrer_id IS NOT NULL THEN
      UPDATE public.referral_tracking
      SET
        is_counted = true,
        counted_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
      WHERE referred_user_id = NEW.user_id
        AND is_counted = false
        AND kyc_completed = true
        AND wallet_funded = true
        AND first_transaction_completed = true;
      
      -- Notification to referred user
      INSERT INTO public.notifications (user_id, title, message, type, category, is_read, related_id, related_type, created_at)
      VALUES (
        NEW.user_id,
        'Referral Complete! ✅',
        'You''ve completed all requirements! Your referrer will receive rewards.',
        'referral',
        'referral',
        false,
        NEW.user_id,
        'referral',
        timezone('utc'::text, now())
      );
      
      -- Update referrals table with new count and tier
      SELECT COUNT(*) INTO current_completed
      FROM public.referral_tracking rt
      WHERE rt.referrer_id = referrer_id AND rt.is_counted = true;
      
      -- Determine new tier and badge
      IF current_completed >= 56 THEN
        new_tier := 6;
        new_badge := 'The One';
      ELSIF current_completed >= 46 THEN
        new_tier := 5;
        new_badge := 'Architect';
      ELSIF current_completed >= 36 THEN
        new_tier := 4;
        new_badge := 'Ascended';
      ELSIF current_completed >= 26 THEN
        new_tier := 3;
        new_badge := 'Enlightened';
      ELSIF current_completed >= 16 THEN
        new_tier := 2;
        new_badge := 'Connected';
      ELSE
        new_tier := 1;
        new_badge := 'Awakening';
      END IF;
      
      UPDATE public.referrals
      SET
        completed_referrals = current_completed,
        current_tier = new_tier,
        badge_name = new_badge,
        tier_1_completed = CASE WHEN current_completed >= 6 THEN true ELSE tier_1_completed END,
        tier_2_completed = CASE WHEN current_completed >= 16 THEN true ELSE tier_2_completed END,
        tier_3_completed = CASE WHEN current_completed >= 26 THEN true ELSE tier_3_completed END,
        tier_4_completed = CASE WHEN current_completed >= 36 THEN true ELSE tier_4_completed END,
        tier_5_completed = CASE WHEN current_completed >= 46 THEN true ELSE tier_5_completed END,
        tier_6_completed = CASE WHEN current_completed >= 56 THEN true ELSE tier_6_completed END,
        max_tier_reached = CASE WHEN new_tier > max_tier_reached THEN new_tier ELSE max_tier_reached END,
        updated_at = timezone('utc'::text, now())
      WHERE user_id = referrer_id;
      
      -- Determine if a tier was just completed
      tier_completed_now := false;
      IF current_completed = 6 THEN tier_completed_now := true;
      ELSIF current_completed = 16 THEN tier_completed_now := true;
      ELSIF current_completed = 26 THEN tier_completed_now := true;
      ELSIF current_completed = 36 THEN tier_completed_now := true;
      ELSIF current_completed = 46 THEN tier_completed_now := true;
      ELSIF current_completed = 56 THEN tier_completed_now := true;
      END IF;
      
      -- Notification for referrer
      IF tier_completed_now THEN
        INSERT INTO public.notifications (user_id, title, message, type, category, is_read, related_id, related_type, created_at)
        VALUES (
          referrer_id,
          'Tier Unlocked! 🎉 ' || new_badge,
          'Congratulations! You''ve unlocked ' || new_badge || ' tier (' || new_tier || '/6). Claim your rewards!',
          'referral',
          'milestone',
          false,
          referrer_id,
          'referral',
          timezone('utc'::text, now())
        );
      ELSE
        -- Progress notification
        INSERT INTO public.notifications (user_id, title, message, type, category, is_read, related_id, related_type, created_at)
        VALUES (
          referrer_id,
          'Referral Counted ✓',
          'You now have ' || current_completed || ' completed referrals!',
          'referral',
          'referral',
          false,
          referrer_id,
          'referral',
          timezone('utc'::text, now())
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
