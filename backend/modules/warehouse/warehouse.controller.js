const Warehouse = require('./warehouse.model');

const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, warehouses });
  } catch (err) { next(err); }
};

const getWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, warehouse });
  } catch (err) { next(err); }
};

const createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, warehouse });
  } catch (err) { next(err); }
};

const updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, warehouse });
  } catch (err) { next(err); }
};

const addLocation = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    warehouse.locations.push(req.body);
    await warehouse.save();
    res.status(201).json({ success: true, warehouse });
  } catch (err) { next(err); }
};

const deleteLocation = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    warehouse.locations = warehouse.locations.filter(l => l._id.toString() !== req.params.locationId);
    await warehouse.save();
    res.json({ success: true, warehouse });
  } catch (err) { next(err); }
};

module.exports = { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, addLocation, deleteLocation };
