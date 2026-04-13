"""
generate_fixtures.py — Phase 1: Data Harvesting for Job Page Canvas Sandbox

Queries BigQuery to extract one representative sample job for each unique
combination of (is_program, order_type, job_type). For each archetype job,
embeds its child tasks and linked system names.

Output: src/data/archetypes.json
"""

import json
import os
from google.cloud import bigquery

# ─── Configuration ──────────────────────────────────────────────────
PROJECT_ID = "xano-fivetran-bq"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "archetypes.json")

# ─── BigQuery Client ────────────────────────────────────────────────
client = bigquery.Client(project=PROJECT_ID)


def fetch_archetype_jobs():
    """
    Fetch one sample completed job per unique (is_program, order_type, job_type)
    combination. Includes key detail fields that map to the 6 canvas widgets.
    """
    query = """
    WITH ranked AS (
      SELECT
        j.id                          AS job_id,
        j.job_number,
        j.order_type,
        j.job_type,
        j.managed_repair_program,
        j.managed_repair_program_id,
        j.insurance_carrier,
        j.insurance_carriers_id,
        j.insurance_claim_number,
        j.estimation_software,
        j.insured_name,
        j.client_project_number,
        j.notes,
        j.client_poc,
        j.date_request_recieved,
        j.client_id,
        j.project_id,

        -- Derived archetype dimensions
        CASE
          WHEN j.managed_repair_program_id IS NOT NULL
               AND j.managed_repair_program_id > 0
          THEN TRUE ELSE FALSE
        END                            AS is_program,

        -- Client info
        c.full_name                    AS client_name,
        c.location                     AS client_location,

        -- Dimensional labels
        dj.job_status_desc             AS job_status,
        dj.estimate_size_category,
        dj.is_large_loss,
        dj.is_urgent,
        dj.current_estimate_value,
        dj.estimated_number_of_rooms,
        dj.estimated_number_of_bathrooms,
        dj.estimated_number_of_kitchens,

        -- Pick 1 per archetype bucket, preferring recently completed jobs
        ROW_NUMBER() OVER (
          PARTITION BY
            CASE WHEN j.managed_repair_program_id IS NOT NULL
                      AND j.managed_repair_program_id > 0
                 THEN 'Program' ELSE 'Non-Program' END,
            j.order_type,
            j.job_type
          ORDER BY j.date_request_recieved DESC
        ) AS rn

      FROM `xano-fivetran-bq.int_xano.int_jobs` j
      LEFT JOIN `xano-fivetran-bq.marts_xano_dims.dim_client` c
        ON j.client_id = c.client_key
      LEFT JOIN `xano-fivetran-bq.marts_xano_dims.dim_job` dj
        ON j.id = dj.job_key
      WHERE j.canceled = FALSE
        AND dj.job_status_desc = 'Completed'
        AND j.order_type IS NOT NULL
        AND j.job_type IS NOT NULL
        AND j.insured_name IS NOT NULL
        AND j.insured_name != ''
    )
    SELECT * FROM ranked WHERE rn = 1
    ORDER BY is_program DESC, order_type, job_type
    """
    print("  [1/3] Fetching archetype jobs from BigQuery...")
    results = client.query(query).result()
    jobs = [dict(row) for row in results]
    print(f"        > Found {len(jobs)} unique archetype combinations.")
    return jobs


def fetch_tasks_for_jobs(job_ids):
    """
    Fetch all tasks for the selected archetype jobs, with task type names.
    """
    if not job_ids:
        return {}

    job_ids_str = ", ".join(str(jid) for jid in job_ids)
    query = f"""
    SELECT
      t.task_key         AS task_id,
      t.job_key          AS job_id,
      t.task_name,
      t.task_status,
      t.task_status_desc,
      t.revision_type,
      t.is_cancelled,
      t.is_urgent,
      t.date_due,
      t.date_received,
      t.date_info_available,
      t.creation_date    AS task_creation_date,
      t.task_age_days,
      t.days_past_due,
      t.priority_category,
      t.task_type_key,
      tt.task_type_name,
      u.full_name        AS assigned_to_name
    FROM `xano-fivetran-bq.marts_xano_dims.dim_task` t
    LEFT JOIN `xano-fivetran-bq.marts_xano_dims.dim_task_type` tt
      ON t.task_type_key = tt.task_type_key
    LEFT JOIN `xano-fivetran-bq.marts_xano_dims.dim_user` u
      ON t.assigned_to_user_key = u.user_key
    WHERE t.job_key IN ({job_ids_str})
      AND t.is_deleted = FALSE
    ORDER BY t.job_key, t.creation_date
    """
    print("  [2/3] Fetching tasks for archetype jobs...")
    results = client.query(query).result()

    tasks_by_job = {}
    for row in results:
        row_dict = dict(row)
        jid = row_dict.pop("job_id")
        tasks_by_job.setdefault(jid, []).append(row_dict)

    total_tasks = sum(len(v) for v in tasks_by_job.values())
    print(f"        > Found {total_tasks} tasks across {len(tasks_by_job)} jobs.")
    return tasks_by_job


def fetch_linked_systems_for_clients(client_ids):
    """
    Fetch linked system names per client (Matterport, CompanyCam, CRM, etc.)
    """
    if not client_ids:
        return {}

    client_ids_str = ", ".join(str(cid) for cid in client_ids)
    query = f"""
    SELECT
      sal.client_id,
      sa.id   AS system_id,
      sa.name AS system_name
    FROM `xano-fivetran-bq.raw_xano_sql_public.ptl_system_access_logins` sal
    JOIN `xano-fivetran-bq.raw_xano_sql_public.ptl_system_access` sa
      ON sal.system_access_id = sa.id
    WHERE sal.client_id IN ({client_ids_str})
      AND sal._fivetran_deleted = FALSE
      AND sa._fivetran_deleted = FALSE
      AND sal.system_access_status != 'Archived'
    GROUP BY sal.client_id, sa.id, sa.name
    ORDER BY sal.client_id, sa.name
    """
    print("  [3/3] Fetching linked systems per client...")
    results = client.query(query).result()

    systems_by_client = {}
    for row in results:
        cid = row["client_id"]
        systems_by_client.setdefault(cid, []).append({
            "system_id": row["system_id"],
            "system_name": row["system_name"]
        })

    print(f"        > Found linked systems for {len(systems_by_client)} clients.")
    return systems_by_client


def serialize_value(v):
    """Convert non-JSON-serializable types (datetime, date, etc.) to strings."""
    import datetime
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.isoformat()
    return v


def build_archetypes(jobs, tasks_by_job, systems_by_client):
    """
    Compose the final archetype objects — each archetype contains:
    - Archetype metadata (label, dimensions)
    - Job details (fields for JobDetailsWidget)
    - Tasks (for TasksTableWidget)
    - Linked systems (for LinksWidget)
    - Notes (for JobNotesWidget)
    - Loss summary placeholder
    """
    archetypes = []
    for job in jobs:
        job_id = job["job_id"]
        client_id = job["client_id"]
        is_program = job["is_program"]

        archetype_label = (
            f"{'Program' if is_program else 'Non-Program'} | "
            f"{job['order_type']} | {job['job_type']}"
        )

        tasks = tasks_by_job.get(job_id, [])
        linked_systems = systems_by_client.get(client_id, [])

        archetype = {
            # ─── Archetype Metadata ─────────────────────────────
            "archetype_id": f"{'pgm' if is_program else 'np'}_{job['order_type'].lower().replace(' & ', '_').replace(' ', '_')}_{job['job_type'].lower()}",
            "archetype_label": archetype_label,
            "is_program": is_program,
            "order_type": job["order_type"],
            "job_type": job["job_type"],

            # ─── JobDetailsWidget Data ──────────────────────────
            "job_details": {
                "job_id": job_id,
                "job_number": job["job_number"],
                "job_status": job.get("job_status", "Unknown"),
                "insured_name": job["insured_name"],
                "client_project_number": job["client_project_number"],
                "client_poc": job.get("client_poc"),
                "insurance_carrier": job["insurance_carrier"],
                "insurance_claim_number": job["insurance_claim_number"],
                "managed_repair_program": job["managed_repair_program"],
                "estimation_software": job["estimation_software"] or "Xactimate",
                "order_type": job["order_type"],
                "job_type": job["job_type"],
                "is_large_loss": job.get("is_large_loss", False),
                "is_urgent": job.get("is_urgent", False),
                "current_estimate_value": job.get("current_estimate_value", 0),
                "estimated_rooms": job.get("estimated_number_of_rooms", 0),
                "estimated_bathrooms": job.get("estimated_number_of_bathrooms", 0),
                "estimated_kitchens": job.get("estimated_number_of_kitchens", 0),
                "estimate_size_category": job.get("estimate_size_category"),
                "date_request_received": serialize_value(job.get("date_request_recieved")),
                "client_name": job.get("client_name"),
                "client_location": job.get("client_location"),
            },

            # ─── TasksTableWidget Data ──────────────────────────
            "tasks": [
                {k: serialize_value(v) for k, v in t.items()}
                for t in tasks
            ],

            # ─── LinksWidget Data ───────────────────────────────
            "linked_systems": linked_systems,
            "has_matterport": any(s["system_id"] == 6 for s in linked_systems),
            "has_companycam": any(s["system_id"] == 10 for s in linked_systems),
            "has_crm": any(
                s["system_id"] in (7, 8, 18, 22, 24, 50)
                for s in linked_systems
            ),

            # ─── LossSummaryWidget Placeholder ──────────────────
            "loss_summary": {
                "has_data": job["job_type"] in ("WTR", "MLD", "STC", "CON"),
                "rooms": [
                    {"name": "Master Bedroom", "items": ["Drywall", "Carpet", "Baseboards"]},
                    {"name": "Kitchen", "items": ["Cabinets", "Flooring", "Countertop"]},
                    {"name": "Living Room", "items": ["Drywall", "Paint", "Carpet"]},
                ] if job["job_type"] in ("WTR", "MLD", "STC", "CON") else []
            },

            # ─── JobNotesWidget Data ────────────────────────────
            "notes": job.get("notes") or "No notes available.",

            # ─── InsuranceGuidelinesWidget Data ─────────────────
            "guidelines": {
                "carrier_id": job.get("insurance_carriers_id"),
                "carrier_name": job.get("insurance_carrier"),
                "mrp_id": job.get("managed_repair_program_id"),
                "mrp_name": job.get("managed_repair_program"),
            }
        }
        archetypes.append(archetype)

    return archetypes


def main():
    print("=" * 60)
    print("Phase 1: Data Harvesting - Job Page Canvas Sandbox")
    print("=" * 60)

    # Step 1: Fetch archetype jobs
    jobs = fetch_archetype_jobs()

    # Step 2: Gather unique IDs for sub-queries
    job_ids = [j["job_id"] for j in jobs]
    client_ids = list(set(j["client_id"] for j in jobs if j["client_id"]))

    # Step 3: Fetch related data
    tasks_by_job = fetch_tasks_for_jobs(job_ids)
    systems_by_client = fetch_linked_systems_for_clients(client_ids)

    # Step 4: Compose final archetype objects
    archetypes = build_archetypes(jobs, tasks_by_job, systems_by_client)

    # Step 5: Write output
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(archetypes, f, indent=2, default=str)

    print(f"\n[OK] Successfully wrote {len(archetypes)} archetypes to:")
    print(f"   {OUTPUT_FILE}")
    print(f"\n   Archetype breakdown:")
    for a in archetypes:
        task_count = len(a["tasks"])
        sys_count = len(a["linked_systems"])
        print(f"   - {a['archetype_label']:50s} | {task_count:2d} tasks | {sys_count:2d} linked systems")


if __name__ == "__main__":
    main()
