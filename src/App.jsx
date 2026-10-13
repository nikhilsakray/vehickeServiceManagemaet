
import { useState, useEffect } from "react";
import "./App.css";

const CUSTOMERS_API = "http://localhost:8080/api/customers";
const VEHICLES_API = "http://localhost:8080/api/vehicles";
const SERVICES_API = "http://localhost:8080/api/services";

// Convert the backend vehicle fields to the names used by your UI.
function mapVehicle(vehicle) {
  return {
    id: vehicle.id,
    registrationNumber: vehicle.vehicleNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    owner: vehicle.ownerName,
  };
}

function App() {
  // Navigation
  const [activePage, setActivePage] = useState("Dashboard");

  // Backend data
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);

  // Loading and error messages
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Customer form
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Vehicle form
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: "",
    brand: "",
    model: "",
    owner: "",
  });

  // Service form
  const [serviceForm, setServiceForm] = useState({
    vehicleId: "",
    serviceType: "",
    serviceDate: new Date().toLocaleDateString("en-CA"),
    cost: "",
    status: "Pending",
  });

  const menuItems = [
    "Dashboard",
    "Customers",
    "Vehicles",
    "Service Records",
  ];

  // ---------------- LOAD DATA FROM BACKEND ----------------

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [customerResponse, vehicleResponse, serviceResponse] =
          await Promise.all([
            fetch(CUSTOMERS_API),
            fetch(VEHICLES_API),
            fetch(SERVICES_API),
          ]);

        if (!customerResponse.ok) {
          throw new Error("Could not load customers.");
        }

        if (!vehicleResponse.ok) {
          throw new Error("Could not load vehicles.");
        }

        if (!serviceResponse.ok) {
          throw new Error("Could not load service records.");
        }

        const [customerData, vehicleData, serviceData] =
          await Promise.all([
            customerResponse.json(),
            vehicleResponse.json(),
            serviceResponse.json(),
          ]);

        setCustomers(customerData);
        setVehicles(vehicleData.map(mapVehicle));
        setServices(serviceData);
        setMessage("");
      } catch (error) {
        setMessage(
          `${error.message} Make sure Spring Boot is running on port 8080.`
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ---------------- CUSTOMER FUNCTIONS ----------------

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function addCustomer(event) {
    event.preventDefault();

    const customerData = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };

    if (
      !customerData.name ||
      !customerData.phone ||
      !customerData.email
    ) {
      alert("Please fill in all customer details.");
      return;
    }

    try {
      const response = await fetch(CUSTOMERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error("Failed to save customer.");
      }

      const savedCustomer = await response.json();

      setCustomers((previous) => [...previous, savedCustomer]);

      setForm({
        name: "",
        phone: "",
        email: "",
      });

      setMessage("Customer added successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteCustomer(id) {
    const customer = customers.find((item) => item.id === id);

    if (!customer) return;

    const hasVehicles = vehicles.some(
      (vehicle) => vehicle.owner === customer.name
    );

    const hasServices = services.some(
      (service) => service.owner === customer.name
    );

    if (hasVehicles || hasServices) {
      alert(
        "This customer has registered vehicles or service records. Delete the related service records and vehicles first."
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      const response = await fetch(`${CUSTOMERS_API}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete customer.");
      }

      setCustomers((previous) =>
        previous.filter((customer) => customer.id !== id)
      );

      setMessage("Customer deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  // ---------------- VEHICLE FUNCTIONS ----------------

  function handleVehicleChange(event) {
    setVehicleForm({
      ...vehicleForm,
      [event.target.name]: event.target.value,
    });
  }

  async function addVehicle(event) {
    event.preventDefault();

    const registration = vehicleForm.registrationNumber
      .trim()
      .toUpperCase();

    const owner = vehicleForm.owner;

    if (
      !registration ||
      !vehicleForm.brand.trim() ||
      !vehicleForm.model.trim() ||
      !owner
    ) {
      alert("Please fill in all vehicle details.");
      return;
    }

    const alreadyExists = vehicles.some(
      (vehicle) =>
        vehicle.registrationNumber.toUpperCase() === registration
    );

    if (alreadyExists) {
      alert("This vehicle is already registered!");
      return;
    }

    const ownerExists = customers.some(
      (customer) => customer.name === owner
    );

    if (!ownerExists) {
      alert("Please select a valid customer.");
      return;
    }

    const vehicleData = {
      vehicleNumber: registration,
      brand: vehicleForm.brand.trim(),
      model: vehicleForm.model.trim(),
      ownerName: owner,
      serviceType: "",
      serviceDate: "",
      serviceCost: 0,
    };

    try {
      const response = await fetch(VEHICLES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error("Failed to register vehicle.");
      }

      const savedVehicle = await response.json();

      setVehicles((previous) => [
        ...previous,
        mapVehicle(savedVehicle),
      ]);

      setVehicleForm({
        registrationNumber: "",
        brand: "",
        model: "",
        owner: "",
      });

      setMessage("Vehicle registered successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteVehicle(id) {
    const hasServices = services.some(
      (service) => Number(service.vehicleId) === Number(id)
    );

    if (hasServices) {
      alert(
        "This vehicle has service records. Delete its service records first."
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this vehicle?")) {
      return;
    }

    try {
      const response = await fetch(`${VEHICLES_API}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vehicle.");
      }

      setVehicles((previous) =>
        previous.filter((vehicle) => vehicle.id !== id)
      );

      setMessage("Vehicle deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  // ---------------- SERVICE RECORD FUNCTIONS ----------------

  function handleServiceChange(event) {
    setServiceForm({
      ...serviceForm,
      [event.target.name]: event.target.value,
    });
  }

  async function addService(event) {
    event.preventDefault();

    const selectedVehicle = vehicles.find(
      (vehicle) =>
        Number(vehicle.id) === Number(serviceForm.vehicleId)
    );

    if (!selectedVehicle) {
      alert("Please select a registered vehicle.");
      return;
    }

    const cost = Number(serviceForm.cost);

    if (!Number.isFinite(cost) || cost < 0) {
      alert("Please enter a valid service cost.");
      return;
    }

    if (!serviceForm.serviceType || !serviceForm.serviceDate) {
      alert("Please enter the service type and date.");
      return;
    }

    const newService = {
      vehicleId: selectedVehicle.id,
      registrationNumber: selectedVehicle.registrationNumber,
      vehicleName: `${selectedVehicle.brand} ${selectedVehicle.model}`,
      owner: selectedVehicle.owner,
      serviceType: serviceForm.serviceType,
      serviceDate: serviceForm.serviceDate,
      cost,
      status: serviceForm.status,
    };

    try {
      const response = await fetch(SERVICES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService),
      });

      if (!response.ok) {
        throw new Error("Failed to save service record.");
      }

      const savedService = await response.json();

      setServices((previous) => [...previous, savedService]);

      setServiceForm({
        vehicleId: "",
        serviceType: "",
        serviceDate: new Date().toLocaleDateString("en-CA"),
        cost: "",
        status: "Pending",
      });

      setMessage("Service record saved successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateServiceStatus(id, newStatus) {
    const existingService = services.find(
      (service) => Number(service.id) === Number(id)
    );

    if (!existingService) return;

    const updatedService = {
      ...existingService,
      status: newStatus,
    };

    try {
      const response = await fetch(`${SERVICES_API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedService),
      });

      if (!response.ok) {
        throw new Error("Failed to update service status.");
      }

      const savedService = await response.json();

      setServices((previous) =>
        previous.map((service) =>
          Number(service.id) === Number(id)
            ? savedService
            : service
        )
      );

      setMessage("Service status updated successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteService(id) {
    if (!window.confirm("Are you sure you want to delete this service record?")) {
      return;
    }

    try {
      const response = await fetch(`${SERVICES_API}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete service record.");
      }

      setServices((previous) =>
        previous.filter((service) => service.id !== id)
      );

      setMessage("Service record deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  // ---------------- DASHBOARD COUNTS ----------------

  const activeServices = services.filter(
    (service) =>
      service.status === "Pending" ||
      service.status === "In Progress"
  ).length;

  const completedServices = services.filter(
    (service) => service.status === "Completed"
  ).length;

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="brand">AutoCare</h2>
        <p className="sidebar-subtitle">Service Management</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={
                activePage === item
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => {
                setActivePage(item);
                setMessage("");
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>
            <p>Vehicle Service Management System</p>
          </div>
        </header>

        {message && (
          <div className="message">
            {message}
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <section className="content-card">
            <p>Loading customers, vehicles, and service records...</p>
          </section>
        ) : (
          <>
            {/* DASHBOARD */}
            {activePage === "Dashboard" && (
              <>
                <section className="stats-grid">
                  <div className="stat-card">
                    <p>Total Customers</p>
                    <h2>{customers.length}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Total Vehicles</p>
                    <h2>{vehicles.length}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Active Services</p>
                    <h2>{activeServices}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Completed Jobs</p>
                    <h2>{completedServices}</h2>
                  </div>
                </section>

                <section className="content-card">
                  <h2>Welcome to AutoCare</h2>
                  <p>
                    Manage customers, vehicles, and service records
                    from one place.
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() => setActivePage("Customers")}
                  >
                    Manage Customers
                  </button>{" "}

                  <button
                    className="primary-btn"
                    onClick={() => setActivePage("Vehicles")}
                  >
                    Manage Vehicles
                  </button>{" "}

                  <button
                    className="primary-btn"
                    onClick={() => setActivePage("Service Records")}
                  >
                    Manage Services
                  </button>
                </section>

                <section className="content-card">
                  <h2>Recent Service Records</h2>

                  {services.length === 0 ? (
                    <p>No service records have been created yet.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Cost</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {[...services]
                            .reverse()
                            .slice(0, 5)
                            .map((service) => (
                              <tr key={service.id}>
                                <td>{service.registrationNumber}</td>
                                <td>{service.serviceType}</td>
                                <td>{service.serviceDate}</td>
                                <td>
                                  ₹{Number(service.cost || 0).toFixed(2)}
                                </td>
                                <td>{service.status}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* CUSTOMER MANAGEMENT */}
            {activePage === "Customers" && (
              <>
                <section className="content-card">
                  <h2>Add New Customer</h2>

                  <form
                    className="customer-form"
                    onSubmit={addCustomer}
                  >
                    <input
                      name="name"
                      placeholder="Customer name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />

                    <input
                      name="phone"
                      type="tel"
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />

                    <input
                      name="email"
                      type="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />

                    <button className="primary-btn" type="submit">
                      Add Customer
                    </button>
                  </form>
                </section>

                <section className="content-card">
                  <h2>Customer List ({customers.length})</h2>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td>{customer.id}</td>
                            <td>{customer.name}</td>
                            <td>{customer.phone}</td>
                            <td>{customer.email}</td>
                            <td>
                              <button
                                className="delete-btn"
                                onClick={() => deleteCustomer(customer.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}

                        {customers.length === 0 && (
                          <tr>
                            <td colSpan="5">No customers found. Add a customer above.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {/* VEHICLE MANAGEMENT */}
            {activePage === "Vehicles" && (
              <>
                <section className="content-card">
                  <h2>Register New Vehicle</h2>

                  <form
                    className="customer-form"
                    onSubmit={addVehicle}
                  >
                    <input
                      name="registrationNumber"
                      placeholder="Registration number"
                      value={vehicleForm.registrationNumber}
                      onChange={handleVehicleChange}
                      required
                    />

                    <input
                      name="brand"
                      placeholder="Vehicle brand"
                      value={vehicleForm.brand}
                      onChange={handleVehicleChange}
                      required
                    />

                    <input
                      name="model"
                      placeholder="Vehicle model"
                      value={vehicleForm.model}
                      onChange={handleVehicleChange}
                      required
                    />

                    <select
                      name="owner"
                      value={vehicleForm.owner}
                      onChange={handleVehicleChange}
                      required
                    >
                      <option value="">Select customer / owner</option>

                      {customers.map((customer) => (
                        <option
                          key={customer.id}
                          value={customer.name}
                        >
                          {customer.name}
                        </option>
                      ))}
                    </select>

                    <button className="primary-btn" type="submit">
                      Register Vehicle
                    </button>
                  </form>
                </section>

                <section className="content-card">
                  <h2>Registered Vehicles ({vehicles.length})</h2>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Registration No.</th>
                          <th>Brand</th>
                          <th>Model</th>
                          <th>Owner</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {vehicles.map((vehicle) => (
                          <tr key={vehicle.id}>
                            <td>{vehicle.registrationNumber}</td>
                            <td>{vehicle.brand}</td>
                            <td>{vehicle.model}</td>
                            <td>{vehicle.owner}</td>
                            <td>
                              <button
                                className="delete-btn"
                                onClick={() => deleteVehicle(vehicle.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}

                        {vehicles.length === 0 && (
                          <tr>
                            <td colSpan="5">No vehicles registered yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {/* SERVICE RECORDS */}
            {activePage === "Service Records" && (
              <>
                <section className="content-card">
                  <h2>Register New Service</h2>

                  {vehicles.length === 0 ? (
                    <p>
                      Please register a vehicle in Vehicle Management
                      before creating a service record.
                    </p>
                  ) : (
                    <form
                      className="customer-form"
                      onSubmit={addService}
                    >
                      <select
                        name="vehicleId"
                        value={serviceForm.vehicleId}
                        onChange={handleServiceChange}
                        required
                      >
                        <option value="">Select vehicle</option>

                        {vehicles.map((vehicle) => (
                          <option
                            key={vehicle.id}
                            value={vehicle.id}
                          >
                            {vehicle.registrationNumber} —{" "}
                            {vehicle.brand} {vehicle.model}
                          </option>
                        ))}
                      </select>

                      <select
                        name="serviceType"
                        value={serviceForm.serviceType}
                        onChange={handleServiceChange}
                        required
                      >
                        <option value="">Select service type</option>
                        <option value="General Service">General Service</option>
                        <option value="Oil Change">Oil Change</option>
                        <option value="Engine Repair">Engine Repair</option>
                        <option value="Brake Repair">Brake Repair</option>
                        <option value="Tyre Replacement">Tyre Replacement</option>
                        <option value="Battery Replacement">Battery Replacement</option>
                        <option value="Other">Other</option>
                      </select>

                      <input
                        name="serviceDate"
                        type="date"
                        value={serviceForm.serviceDate}
                        onChange={handleServiceChange}
                        required
                      />

                      <input
                        name="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Estimated cost (₹)"
                        value={serviceForm.cost}
                        onChange={handleServiceChange}
                        required
                      />

                      <select
                        name="status"
                        value={serviceForm.status}
                        onChange={handleServiceChange}
                        required
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>

                      <button className="primary-btn" type="submit">
                        Add Service Record
                      </button>
                    </form>
                  )}
                </section>

                <section className="content-card">
                  <h2>Service Records ({services.length})</h2>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Vehicle No.</th>
                          <th>Vehicle</th>
                          <th>Owner</th>
                          <th>Service Type</th>
                          <th>Date</th>
                          <th>Cost</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {services.map((service) => (
                          <tr key={service.id}>
                            <td>{service.registrationNumber}</td>
                            <td>{service.vehicleName}</td>
                            <td>{service.owner}</td>
                            <td>{service.serviceType}</td>
                            <td>{service.serviceDate}</td>
                            <td>
                              ₹{Number(service.cost || 0).toFixed(2)}
                            </td>
                            <td>
                              <select
                                aria-label={`Status for ${service.registrationNumber}`}
                                value={service.status}
                                onChange={(event) =>
                                  updateServiceStatus(
                                    service.id,
                                    event.target.value
                                  )
                                }
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td>
                              <button
                                className="delete-btn"
                                onClick={() => deleteService(service.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}

                        {services.length === 0 && (
                          <tr>
                            <td colSpan="8">
                              No service records yet. Add a service above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;