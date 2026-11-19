-- Role IDs match the APEX workspace (1 resident, 2 collector, 3 management, 4 admin).
insert into cw_roles (role_id, role_code, role_name) values
  (1, 'RESIDENT',   'Resident'),
  (2, 'COLLECTOR',  'Waste Collector'),
  (3, 'MANAGEMENT', 'Management / JMB'),
  (4, 'ADMIN',      'System Administrator');
select setval(pg_get_serial_sequence('cw_roles', 'role_id'), 4);
