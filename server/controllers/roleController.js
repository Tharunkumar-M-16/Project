import Role from '../models/Role.js';

// GET /api/roles — list all target roles
export const listRoles = async (req, res) => {
  const roles = await Role.find().sort('name');
  res.json(roles);
};

// GET /api/roles/:name
export const getRole = async (req, res) => {
  const role = await Role.findOne({ name: req.params.name });
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json(role);
};

// POST /api/roles — admin/tutor creates a target role
export const createRole = async (req, res) => {
  const { name, description, requiredSkills, requiredProjects } = req.body;
  if (!name) return res.status(400).json({ message: 'Role name is required' });
  const exists = await Role.findOne({ name });
  if (exists) return res.status(400).json({ message: 'Role already exists' });
  const role = await Role.create({ name, description, requiredSkills, requiredProjects });
  res.status(201).json(role);
};
