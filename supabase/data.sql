-- Data from the Oracle APEX workspace (WKSP_COLLECTION), with the same IDs.
-- Timestamps are as stored in APEX (server time, assumed UTC).
-- Phone numbers and emails of real people are left blank; add them in the Table Editor.

insert into cw_floors (floor_id, block_name, floor_number, floor_label, is_active) values
  (1, 'Block 2', 1, 'Demo Floor 1 UPDATED', true),
  (2, 'Block 2', 4, 'Demo Floor 4', true),
  (3, 'Block 2', 5, 'Demo Floor 5', true),
  (21, 'Block 2', 2, 'Demo Floor 2', true),
  (22, 'Block 2', 3, 'Demo Floor 3', true),
  (23, 'Block 2', 6, 'Demo Floor 6', false);
select setval(pg_get_serial_sequence('cw_floors', 'floor_id'), (select max(floor_id) from cw_floors));

insert into cw_users (user_id, apex_username, full_name, email, phone_number, role_id, floor_id, account_status, created_at, updated_at) values
  (26, 'junhong2609', 'LIEW JUN HONG', null, null, 4, null, 'ACTIVE', '2026-11-15 20:12:21.445266+00', null),
  (43, 'Money1234', 'Jun Liang', 'junliang1234@gmail.com', '+60123456789', 2, null, 'ACTIVE', '2026-11-16 17:33:44.229065+00', '2026-11-17 00:00:00.000000+00'),
  (45, 'hello1234', '1234Hi', 'hello5678@gmail.com', '+60123456799', 3, null, 'ACTIVE', '2026-11-16 21:04:27.304166+00', '2026-11-17 00:00:00.000000+00'),
  (46, 'Hello5678', 'hello9875', 'hello9876@gmail.com', '+60123456777', 1, 22, 'ACTIVE', '2026-11-16 21:05:32.461875+00', '2026-11-17 00:00:00.000000+00'),
  (61, 'yuning', 'LIEW YU NING', null, null, 1, 21, 'ACTIVE', '2026-11-16 00:00:00.000000+00', '2026-11-16 12:34:37.983995+00'),
  (82, 'Hello', 'Hi', 'hello1234@gmail.com', '+60123456788', 4, null, 'ACTIVE', '2026-11-16 21:02:34.525205+00', '2026-11-17 00:00:00.000000+00');
select setval(pg_get_serial_sequence('cw_users', 'user_id'), (select max(user_id) from cw_users));

-- From CW_REPORTS; status mapped as in docs/apex-reference.md.
insert into cw_missed_reports (report_id, resident_id, floor_id, report_category, description, report_status, assigned_to, reported_at) values
  (1, 26, null, 'Damaged Bin', null, 'PENDING', null, '2026-11-16 13:40:12.450879+00'),
  (2, 61, 21, 'Damaged Bin', null, 'PENDING', null, '2026-11-16 13:44:47.480531+00'),
  (3, 61, 21, 'Illegal Dumping', 'dalsodh', 'IN_PROGRESS', null, '2026-11-16 13:48:15.640775+00');
select setval(pg_get_serial_sequence('cw_missed_reports', 'report_id'), (select max(report_id) from cw_missed_reports));
