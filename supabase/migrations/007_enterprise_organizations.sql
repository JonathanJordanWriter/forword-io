-- Enterprise publisher accounts: organizations, memberships, and invitations.
-- Adds nullable org_id to books and plans so managers can access author data.
-- All existing rows keep org_id = null — the consumer product is unaffected.

-- ─── TABLES ───────────────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text NOT NULL,
  stripe_customer_id     text,
  stripe_subscription_id text,
  seat_count             integer NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE org_memberships (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  role           text NOT NULL CHECK (role IN ('owner', 'manager', 'author')),
  invited_email  text,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  joined_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE org_invitations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_email  text NOT NULL,
  role           text NOT NULL CHECK (role IN ('owner', 'manager', 'author')),
  expires_at     timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── ADD org_id TO EXISTING TABLES ───────────────────────────────────────────

ALTER TABLE books ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE plans ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX org_memberships_org_id_idx  ON org_memberships(org_id);
CREATE INDEX org_memberships_user_id_idx ON org_memberships(user_id);
CREATE INDEX org_invitations_org_id_idx  ON org_invitations(org_id);
CREATE INDEX books_org_id_idx            ON books(org_id);
CREATE INDEX plans_org_id_idx            ON plans(org_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

ALTER TABLE organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

-- organizations: visible to members of that org
CREATE POLICY "org members can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- org_memberships: members can view all memberships in their org;
-- only owners can insert/update/delete
CREATE POLICY "org members can view memberships in their org"
  ON org_memberships FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "org owners can manage memberships"
  ON org_memberships FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );

-- org_invitations: owners and managers can view; owners can insert
CREATE POLICY "org owners and managers can view invitations"
  ON org_invitations FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
        AND status = 'active'
    )
  );

CREATE POLICY "org owners can create invitations"
  ON org_invitations FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );

-- books: org managers and owners can view books belonging to their org
CREATE POLICY "org managers can view books in their org"
  ON books FOR SELECT
  USING (
    org_id IS NOT NULL AND
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
        AND status = 'active'
    )
  );

-- plans: org managers and owners can view and update plans belonging to their org
CREATE POLICY "org managers can view plans in their org"
  ON plans FOR SELECT
  USING (
    org_id IS NOT NULL AND
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
        AND status = 'active'
    )
  );

CREATE POLICY "org managers can update plans in their org"
  ON plans FOR UPDATE
  USING (
    org_id IS NOT NULL AND
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
        AND status = 'active'
    )
  );
