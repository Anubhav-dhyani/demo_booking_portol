import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  BriefcaseBusiness,
  Building2,
  Bus,
  CalendarDays,
  Car,
  Check,
  CircleDollarSign,
  CreditCard,
  LogIn,
  LogOut,
  Plane,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound
} from "lucide-react";
import {
  clearSession,
  createBooking,
  createInventoryItem,
  deleteInventoryItem,
  getBooking,
  getSessionUser,
  listProviderModes,
  listMyBookings,
  listAdminInventory,
  listBookings,
  loginUser,
  registerUser,
  retryAtreImport,
  saveSession,
  searchFlights,
  searchHotels,
  searchTransport,
  sendFlightCancellation,
  sendFlightDelay,
  updateProviderMode,
  updateInventoryItem
} from "./api.js";

const initialTrip = {
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  tripPurpose: "business",
  cabin: ""
};

const typeMeta = {
  flight: { label: "Flights", icon: Plane },
  hotel: { label: "Hotels", icon: BedDouble },
  transport: { label: "Cabs", icon: Car }
};

const money = (price) => `$${Number(price?.amount || 0).toLocaleString()} ${price?.currency || "USD"}`;
const bookingId = () => `bk_${Math.floor(1000 + Math.random() * 9000)}`;
const formatTime = (value) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

function goTo(path, replace = false) {
  if (replace) window.history.replaceState({}, "", path);
  else window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);
  return path;
}

function useNavigate() {
  return (path, options = {}) => goTo(path, options.replace);
}

function useSession() {
  const [user, setUser] = useState(() => getSessionUser());
  useEffect(() => {
    const updateUser = () => setUser(getSessionUser());
    window.addEventListener("authchange", updateUser);
    window.addEventListener("storage", updateUser);
    return () => {
      window.removeEventListener("authchange", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);
  return user;
}

function Link({ to, className, children }) {
  return (
    <a
      className={className}
      href={to}
      onClick={(event) => {
        event.preventDefault();
        goTo(to);
      }}
    >
      {children}
    </a>
  );
}

function Navigate({ to, replace = false }) {
  useEffect(() => goTo(to, replace), [replace, to]);
  return null;
}

function useBookingDraft() {
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem("bookingDraft");
    return saved ? JSON.parse(saved) : { itinerary: initialTrip };
  });
  useEffect(() => localStorage.setItem("bookingDraft", JSON.stringify(draft)), [draft]);

  function updateDraft(nextDraft) {
    localStorage.setItem("bookingDraft", JSON.stringify(nextDraft));
    setDraft(nextDraft);
  }

  return [draft, updateDraft];
}

function PageShell({ children }) {
  const user = useSession();
  const path = usePath();

  function logout() {
    clearSession();
    goTo("/");
  }

  const navLinkClass = (target) =>
    `rounded-full px-4 py-2 text-sm font700 transition ${
      path === target ? "bg-blue-50 text-amex" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
    }`;

  return (
    <div className="min-h-screen bg-travel-surface text-ink">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-amex text-white shadow-blue">
              <Plane size={21} />
            </span>
            <span>
              <span className="block text-lg font800 leading-5 text-ink">TripPilot</span>
              <span className="hidden text-xs font700 uppercase text-slate-500 sm:block">Official booking platform</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Link className={navLinkClass("/")} to="/">Book</Link>
            {user?.role === "user" ? <Link className={navLinkClass("/bookings")} to="/bookings">My Trips</Link> : null}
            {user?.role === "admin" ? <Link className={navLinkClass("/admin/bookings")} to="/admin/bookings">Bookings</Link> : null}
            {user?.role === "admin" ? <Link className={navLinkClass("/admin/inventory")} to="/admin/inventory">Inventory</Link> : null}
            {user ? (
              <>
                <span className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font700 text-slate-700 md:inline">{user.name}</span>
                <button className="icon-btn" type="button" onClick={logout} title="Logout"><LogOut size={17} /></button>
              </>
            ) : (
              <>
                <Link className={navLinkClass("/login")} to="/login">Login</Link>
                <Link className="btn-primary" to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function AuthPage({ mode }) {
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [form, setForm] = useState({
    name: "Anubhav Dhyani",
    email: "anubhav@example.com",
    phone: "+15555550123",
    password: "password123"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = isRegister
        ? await registerUser(form)
        : await loginUser({ email: form.email, password: form.password });
      saveSession(session);
      navigate(session.user.role === "admin" ? "/admin/bookings" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-panel">
          <div className="mb-5 flex items-center gap-2">
            <LogIn className="text-amex" />
            <h1 className="text-2xl font-semibold">{isRegister ? "Create Account" : "Login"}</h1>
          </div>
          <form className="grid gap-4" onSubmit={submit}>
            {isRegister ? <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} /> : null}
            <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            {isRegister ? <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} /> : null}
            <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <button className="btn-primary" disabled={loading} type="submit"><LogIn size={18} />{loading ? "Signing in..." : isRegister ? "Register" : "Login"}</button>
          </form>
          <div className="mt-4 text-sm">
            <Link className="font-medium text-amex" to={isRegister ? "/login" : "/register"}>{isRegister ? "Use existing account" : "Create traveler account"}</Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useBookingDraft();
  const [form, setForm] = useState(draft.itinerary || initialTrip);
  const [activeSection, setActiveSection] = useState("flight");
  const [error, setError] = useState("");
  const categories = [
    ["flight", Plane, "Flights"],
    ["hotel", Building2, "Hotels"],
    ["transport", Car, "Cabs"]
  ];
  const activeMeta = categories.find(([key]) => key === activeSection);
  const ActiveIcon = activeMeta?.[1] || Plane;
  const activeLabel = activeMeta?.[2] || "Flights";

  function submit(event) {
    event.preventDefault();
    setError("");

    const missing = missingSearchFields(activeSection, form);

    if (missing.length > 0) {
      setError(`Please enter ${missing.join(", ")}.`);
      return;
    }

    setDraft({ itinerary: form, flight: null, hotel: null, transport: null });
    navigate(["flight", "hotel", "transport"].includes(activeSection) ? `/select/${activeSection}` : "/select/flight");
  }

  return (
    <PageShell>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(8,43,91,0.88),rgba(4,79,161,0.78)_48%,rgba(245,247,251,1)_48%),url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center px-4 pb-16 pt-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-6 text-white md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font800 uppercase text-sky-100">Flights, hotels and cabs in one booking</p>
              <h1 className="text-4xl font800 leading-tight md:text-6xl">Book smarter trips with instant protection.</h1>
            </div>
            <div className="grid max-w-sm gap-3 rounded-lg border border-white/20 bg-white/10 p-4 text-sm font700 backdrop-blur">
              <span className="flex items-center gap-2"><ShieldCheck size={18} /> Verified booking flow</span>
              <span className="flex items-center gap-2"><CreditCard size={18} /> Secure demo checkout</span>
            </div>
          </div>

          <form onSubmit={submit} className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-panel md:p-6">
            <div className="-mt-12 mb-6 grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-panel md:w-[520px]">
              {categories.map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={`relative grid place-items-center gap-2 rounded-md p-4 text-center text-sm font800 transition ${activeSection === key ? "bg-blue-50 text-amex" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Icon size={30} />
                  {label}
                  {activeSection === key ? <span className="absolute inset-x-6 -bottom-2 h-1 rounded-full bg-amex" /> : null}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm font800">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-amex"><ActiveIcon size={18} /></span>
                <span>{activeLabel}</span>
              </div>
              <span className="text-slate-500">{sectionSubtitle(activeSection)}</span>
            </div>

            <SearchSectionFields section={activeSection} form={form} setForm={setForm} />
            {error ? <Alert tone="danger">{error}</Alert> : null}

            <button className="absolute -bottom-8 left-1/2 inline-flex w-64 -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-amex px-6 py-4 text-xl font800 text-white shadow-blue transition hover:-translate-x-1/2 hover:-translate-y-0.5" type="submit">
              <Search size={24} />
              Search
            </button>
          </form>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              ["Flexible inventory", "Flights, hotels and cabs stay in one clean booking path."],
              ["Fast checkout", "Traveler and payment details stay focused and easy to scan."],
              ["Admin ready", "Provider mode, inventory and disruption controls share the same UI system."]
            ].map(([title, text]) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
                <h2 className="font800">{title}</h2>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function SelectionPage({ type }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useBookingDraft();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const meta = typeMeta[type];
  const next = type === "flight" ? "/select/hotel" : type === "hotel" ? "/select/transport" : "/checkout";

  useEffect(() => {
    setLoading(true);
    setError("");

    if (type === "flight") {
      searchFlights({
        origin: draft.itinerary.origin,
        destination: draft.itinerary.destination,
        departure_date: draft.itinerary.departureDate
      })
        .then((data) => setItems(data.fares || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
      return;
    }

    const searcher = type === "hotel" ? searchHotels : searchTransport;
    searcher(draft.itinerary)
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [draft.itinerary.departureDate, draft.itinerary.destination, draft.itinerary.origin, type]);

  function choose(item) {
    setDraft({ ...draft, [type]: normalizeItem(item, draft.itinerary) });
    navigate(next);
  }

  function skip() {
    setDraft({ ...draft, [type]: null });
    navigate(next);
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <FlowHeader active={type} />
        <PageTitle icon={meta.icon} title={`Choose ${meta.label.toLowerCase()}`} subtitle="Results use admin-selected provider mode, then fall back to database inventory when configured." />
        <div className="mb-5 flex justify-end">
          <button className="btn-secondary" type="button" onClick={skip}>Skip {meta.label}</button>
        </div>
        {loading ? <p>Loading {meta.label.toLowerCase()}...</p> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {!loading && items.length === 0 ? (
          <EmptyState title={`No ${meta.label.toLowerCase()} available`} message={type === "flight" ? "No fares came back for this route/date, or the provider is unavailable." : "Ask an admin to add inventory, or skip this section."} />
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <SelectableCard
              key={item._id}
              icon={meta.icon}
              title={item.title}
              subtitle={item.subtitle || type}
              price={item.price}
              selected={draft[type]?._inventoryId === item._id}
              details={describeInventory(item)}
              onSelect={() => choose(item)}
            />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const sessionUser = useSession();
  const [draft] = useBookingDraft();
  const [payment, setPayment] = useState({ cardBrand: "American Express", last4: "1005" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selected = [draft.flight, draft.hotel, draft.transport].filter(Boolean);
  const total = useMemo(() => selected.reduce((sum, item) => sum + Number(item.price?.amount || 0), 0), [selected]);

  if (!sessionUser || sessionUser.role !== "user") return <Navigate to="/login" replace />;

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      externalBookingId: bookingId(),
      externalUserId: sessionUser.externalUserId,
      source: "demo-booking-portal",
      user: {
        name: sessionUser.name,
        email: sessionUser.email,
        phone: sessionUser.phone
      },
      itinerary: {
        title: `${draft.itinerary.origin} to ${draft.itinerary.destination} trip`,
        origin: draft.itinerary.origin,
        destination: draft.itinerary.destination,
        departureDate: draft.itinerary.departureDate,
        tripPurpose: draft.itinerary.tripPurpose
      },
      flight: draft.flight,
      hotel: draft.hotel,
      transport: draft.transport,
      meetings: [
        {
          title: "Client strategy meeting",
          location: draft.itinerary.destination,
          startTime: "2026-08-16T09:00:00-07:00",
          endTime: "2026-08-16T10:00:00-07:00"
        }
      ],
      preferences: {
        seat: "Window",
        preferredCabin: draft.itinerary.cabin,
        maxDelayMinutes: 120,
        preferSameAirline: false,
        allowHotelChanges: true,
        allowTransportChanges: true
      },
      travelPolicy: {
        maxRecoveryCostDelta: 500
      },
      cardBenefits: {
        product: "American Express Platinum",
        disruptionProtection: true
      },
      payment
    };

    try {
      const booking = await createBooking(payload);
      localStorage.removeItem("bookingDraft");
      navigate(`/confirmation/${booking._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <FlowHeader active="checkout" />
        <PageTitle icon={CreditCard} title="Checkout" subtitle="Confirm the selected trip services and payment." />
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-5">
            <Panel title="Traveler" icon={UserRound}>
              <div className="grid gap-2 text-sm text-slate-700">
                <p><strong>Name:</strong> {sessionUser.name}</p>
                <p><strong>Email:</strong> {sessionUser.email}</p>
                <p><strong>Phone:</strong> {sessionUser.phone}</p>
              </div>
            </Panel>
            <Panel title="Payment" icon={CircleDollarSign}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Card brand" value={payment.cardBrand} onChange={(cardBrand) => setPayment({ ...payment, cardBrand })} />
                <Field label="Last 4" value={payment.last4} onChange={(last4) => setPayment({ ...payment, last4 })} />
              </div>
            </Panel>
            {error ? <Alert tone="danger">{error}</Alert> : null}
          </div>
          <Panel title="Trip summary" icon={ShieldCheck}>
            {selected.length === 0 ? <p className="text-sm text-slate-600">No paid service selected. You can still create a demo trip shell.</p> : null}
            {draft.flight ? <SummaryItem label="Flight" value={`${draft.flight.airline} ${draft.flight.flightNumber}`} price={draft.flight.price} /> : null}
            {draft.hotel ? <SummaryItem label="Hotel" value={draft.hotel.hotelName} price={draft.hotel.price} /> : null}
            {draft.transport ? <SummaryItem label="Cab" value={draft.transport.type} price={draft.transport.price} /> : null}
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>${total.toLocaleString()} USD</span></div>
            </div>
            <button className="btn-primary mt-5 w-full" disabled={loading} type="submit"><CreditCard size={18} />{loading ? "Confirming..." : "Confirm Payment"}</button>
          </Panel>
        </form>
      </div>
    </PageShell>
  );
}

function ConfirmationPage({ id }) {
  const [booking, setBooking] = useState(null);
  useEffect(() => {
    getBooking(id).then(setBooking).catch(() => setBooking(false));
  }, [id]);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded border border-slate-200 bg-white p-8 text-center shadow-panel">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-mint text-white"><ShieldCheck size={32} /></div>
          <h1 className="text-3xl font-semibold">Your trip has been booked and protected by Amex ATRE.</h1>
          {booking ? (
            <div className="mx-auto mt-6 max-w-2xl rounded bg-slate-50 p-4 text-left text-sm text-slate-700">
              <p><strong>Booking:</strong> {booking.externalBookingId}</p>
              <p><strong>ATRE import:</strong> {booking.atreImport.status}</p>
              {booking.atreImport.status !== "sent" ? <p className="mt-2 text-slate-600">ATRE is not synced yet. Use My Bookings to sync again when ATRE is available.</p> : null}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="btn-secondary" to="/">Book Another Trip</Link>
            <Link className="btn-primary" to="/bookings">View My Bookings</Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function MyBookingsPage() {
  const sessionUser = useSession();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionUser || sessionUser.role !== "user") return;
    listMyBookings().then(setBookings).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [sessionUser]);

  if (!sessionUser || sessionUser.role !== "user") return <Navigate to="/login" replace />;

  async function syncBooking(id) {
    setMessage("");
    setError("");
    try {
      const updated = await retryAtreImport(id);
      setBookings((current) => current.map((booking) => booking._id === updated._id ? updated : booking));
      setMessage(updated.atreImport?.status === "sent" ? "ATRE import synced." : "ATRE import is still failing. Try again later.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PageTitle icon={BriefcaseBusiness} title="My bookings" subtitle="Trips you booked on this travel platform." />
        {loading ? <p>Loading bookings...</p> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone={message.includes("synced") ? "success" : "danger"}>{message}</Alert> : null}
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <article key={booking._id} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="font-semibold">{booking.externalBookingId}</h2>
                  <p className="text-sm text-slate-600">{booking.itinerary.origin || "Origin"} to {booking.itinerary.destination || "Destination"} · {booking.itinerary.departureDate || "Date pending"}</p>
                  <p className="mt-1 text-sm text-slate-500">{booking.flight ? `Flight ${booking.flight.flightNumber}` : "No flight"} · {booking.hotel ? booking.hotel.hotelName : "No hotel"} · {booking.transport ? booking.transport.type : "No cab"}</p>
                  <p className="mt-1 text-sm font-medium text-amex">ATRE import: {booking.atreImport?.status || "pending"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {booking.atreImport?.status !== "sent" ? <button className="btn-primary" type="button" onClick={() => syncBooking(booking._id)}>Sync ATRE</button> : null}
                  <Link className="btn-secondary" to={`/confirmation/${booking._id}`}>View Details</Link>
                </div>
              </div>
            </article>
          ))}
          {!loading && bookings.length === 0 ? <EmptyState title="No bookings yet" message="Search and checkout to create your first booking." /> : null}
        </div>
      </div>
    </PageShell>
  );
}

function AdminBookingsPage() {
  const sessionUser = useSession();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionUser || sessionUser.role !== "admin") return;
    listBookings().then(setBookings).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [sessionUser]);

  if (!sessionUser || sessionUser.role !== "admin") return <Navigate to="/login" replace />;

  async function syncBooking(id) {
    setMessage("");
    setError("");
    try {
      const updated = await retryAtreImport(id);
      setBookings((current) => current.map((booking) => booking._id === updated._id ? updated : booking));
      setMessage(updated.atreImport?.status === "sent" ? "ATRE import synced." : "ATRE import is still failing. Try again later.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <PageTitle icon={BriefcaseBusiness} title="Admin bookings" subtitle="Bookings created on this demo travel platform." />
          <Link className="btn-primary" to="/admin/inventory"><Plus size={18} />Manage Inventory</Link>
        </div>
        {loading ? <p>Loading bookings...</p> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone={message.includes("synced") ? "success" : "danger"}>{message}</Alert> : null}
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <article key={booking._id} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="font-semibold">{booking.externalBookingId}</h2>
                  <p className="text-sm text-slate-600">{booking.user.name} · {booking.itinerary.origin} to {booking.itinerary.destination}</p>
                  <p className="mt-1 text-sm text-slate-500">{booking.flight ? `Flight ${booking.flight.flightNumber}` : "No flight"} · {booking.hotel ? booking.hotel.hotelName : "No hotel"} · {booking.transport ? booking.transport.type : "No cab"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {booking.atreImport?.status !== "sent" ? <button className="btn-secondary" type="button" onClick={() => syncBooking(booking._id)}>Sync ATRE</button> : null}
                  {booking.flight ? (
                    <Link className="btn-primary" to={`/admin/disruptions/${booking._id}`}><AlertTriangle size={18} />Simulate Disruption</Link>
                  ) : (
                    <span className="rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500">No flight to disrupt</span>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!loading && bookings.length === 0 ? <EmptyState title="No bookings yet" message="Create a traveler booking first." /> : null}
        </div>
      </div>
    </PageShell>
  );
}

function AdminInventoryPage() {
  const sessionUser = useSession();
  const [items, setItems] = useState([]);
  const [providerModes, setProviderModes] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(blankInventoryForm("flight"));

  useEffect(() => {
    if (!sessionUser || sessionUser.role !== "admin") return;
    refreshInventory();
  }, [sessionUser]);

  if (!sessionUser || sessionUser.role !== "admin") return <Navigate to="/login" replace />;

  function refreshInventory() {
    listAdminInventory().then(setItems).catch((err) => setError(err.message));
    listProviderModes().then(setProviderModes).catch((err) => setError(err.message));
  }

  function changeType(type) {
    setForm(blankInventoryForm(type));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await createInventoryItem(formToInventory(form));
      setMessage("Inventory item added.");
      setForm(blankInventoryForm(form.type));
      refreshInventory();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(item) {
    await updateInventoryItem(item._id, { active: !item.active });
    refreshInventory();
  }

  async function removeItem(item) {
    await deleteInventoryItem(item._id);
    refreshInventory();
  }

  async function changeProviderMode(type, mode) {
    setMessage("");
    setError("");
    try {
      const updated = await updateProviderMode(type, mode);
      setProviderModes((current) => current.map((setting) => setting.type === updated.type ? updated : setting));
      setMessage(`${typeMeta[type].label} search mode updated.`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PageTitle icon={Plus} title="Admin inventory" subtitle="Add flights, hotels, and cabs that travelers can book." />
        <Panel title="Search source" icon={Search}>
          <div className="grid gap-3 md:grid-cols-3">
            {["flight", "hotel", "transport"].map((type) => {
              const setting = providerModes.find((mode) => mode.type === type);
              const mode = setting?.mode || (setting?.useProvider ? "ignav" : "manual");
              const Icon = typeMeta[type].icon;

              return (
                <label key={type} className="grid gap-3 rounded border border-slate-200 p-4">
                  <span className="flex items-center gap-3 font-semibold">
                    <Icon className="text-amex" size={20} />
                    {typeMeta[type].label}
                  </span>
                  <select className="input" value={mode} onChange={(event) => changeProviderMode(type, event.target.value)}>
                    <option value="manual">Manual DB</option>
                    {type === "flight" ? <option value="ignav">IGNAV API</option> : null}
                    {type === "hotel" ? <option value="google">Google Places API</option> : null}
                    {type === "hotel" ? <option value="geoapify">Geoapify API</option> : null}
                  </select>
                </label>
              );
            })}
          </div>
        </Panel>
        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <Panel title="Add inventory" icon={Plus}>
            <form className="grid gap-4" onSubmit={submit}>
              <label className="grid gap-2 text-sm font-medium">
                Section
                <select className="input" value={form.type} onChange={(event) => changeType(event.target.value)}>
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="transport">Cab</option>
                </select>
              </label>
              <InventoryFields form={form} setForm={setForm} />
              {message ? <Alert tone="success">{message}</Alert> : null}
              {error ? <Alert tone="danger">{error}</Alert> : null}
              <button className="btn-primary" type="submit"><Plus size={18} />Add Item</button>
            </form>
          </Panel>
          <Panel title="Available inventory" icon={BriefcaseBusiness}>
            <div className="grid gap-3">
              {items.map((item) => {
                const Icon = typeMeta[item.type].icon;
                return (
                  <article key={item._id} className="rounded border border-slate-200 p-4">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-amex"><Icon size={20} /></span>
                        <div>
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm text-slate-600">{item.subtitle} · {money(item.price)} · {item.active ? "Active" : "Hidden"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-secondary" type="button" onClick={() => toggleActive(item)}>{item.active ? "Hide" : "Show"}</button>
                        <button className="btn-danger" type="button" onClick={() => removeItem(item)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {items.length === 0 ? <EmptyState title="No inventory yet" message="Add your first flight, hotel, or cab." /> : null}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function AdminDisruptionPage({ id }) {
  const sessionUser = useSession();
  const [booking, setBooking] = useState(null);
  const [modal, setModal] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState(180);
  const [delayReason, setDelayReason] = useState("Operational delay");
  const [cancelReason, setCancelReason] = useState("Aircraft unavailable");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionUser || sessionUser.role !== "admin") return;
    getBooking(id).then(setBooking).catch((err) => setError(err.message));
  }, [id, sessionUser]);

  if (!sessionUser || sessionUser.role !== "admin") return <Navigate to="/login" replace />;

  async function delayFlight() {
    setMessage("");
    setError("");
    try {
      const result = await sendFlightDelay(id, delayMinutes, delayReason);
      setMessage(result.message);
      setModal(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelFlight() {
    setMessage("");
    setError("");
    try {
      const result = await sendFlightCancellation(id, cancelReason);
      setMessage(result.message);
      setModal(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!booking && !error) return <PageShell><div className="mx-auto max-w-7xl px-4 py-8">Loading booking...</div></PageShell>;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-amex" to="/admin/bookings"><ArrowLeft size={16} />Back to bookings</Link>
        <PageTitle icon={AlertTriangle} title="Admin disruption simulator" subtitle="Send flight delay or cancellation events to ATRE." />
        {booking?.flight ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Panel title="Selected flight" icon={Plane}>
              <p className="text-lg font-semibold">{booking.flight.airline} {booking.flight.flightNumber}</p>
              <p className="text-sm text-slate-600">{booking.flight.origin} to {booking.flight.destination}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <p><strong>Booking:</strong> {booking.externalBookingId}</p>
                <p><strong>Traveler:</strong> {booking.user.name}</p>
                <p><strong>Departure:</strong> {formatTime(booking.flight.departureTime)}</p>
              </div>
            </Panel>
            <Panel title="Actions" icon={CalendarDays}>
              <div className="grid gap-3">
                <button className="btn-primary w-full" type="button" onClick={() => setModal("delay")}><AlertTriangle size={18} />Delay Flight</button>
                <button className="btn-danger w-full" type="button" onClick={() => setModal("cancel")}><AlertTriangle size={18} />Cancel Flight</button>
              </div>
            </Panel>
          </div>
        ) : <Alert tone="danger">This booking has no flight, so a flight disruption cannot be sent.</Alert>}
        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
      {modal ? (
        <Modal title={modal === "delay" ? "Delay Flight" : "Cancel Flight"} onClose={() => setModal(null)}>
          {modal === "delay" ? (
            <div className="grid gap-4">
              <Field label="Delay minutes" type="number" value={delayMinutes} onChange={setDelayMinutes} />
              <Field label="Reason" value={delayReason} onChange={setDelayReason} />
              <button className="btn-primary" type="button" onClick={delayFlight}>Submit Delay</button>
            </div>
          ) : (
            <div className="grid gap-4">
              <Field label="Reason" value={cancelReason} onChange={setCancelReason} />
              <button className="btn-danger" type="button" onClick={cancelFlight}>Submit Cancellation</button>
            </div>
          )}
        </Modal>
      ) : null}
    </PageShell>
  );
}

function InventoryFields({ form, setForm }) {
  const setDetails = (patch) => setForm({ ...form, details: { ...form.details, ...patch } });
  return (
    <>
      <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
      <Field label="Subtitle" value={form.subtitle} onChange={(subtitle) => setForm({ ...form, subtitle })} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Price" type="number" value={form.price.amount} onChange={(amount) => setForm({ ...form, price: { ...form.price, amount } })} />
        <Field label="Currency" value={form.price.currency} onChange={(currency) => setForm({ ...form, price: { ...form.price, currency } })} />
      </div>
      {form.type === "flight" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Airline" value={form.details.airline} onChange={(airline) => setDetails({ airline })} />
            <Field label="Flight number" value={form.details.flightNumber} onChange={(flightNumber) => setDetails({ flightNumber })} />
            <Field label="Origin airport code" value={form.details.origin} onChange={(origin) => setDetails({ origin: origin.toUpperCase() })} />
            <Field label="Destination airport code" value={form.details.destination} onChange={(destination) => setDetails({ destination: destination.toUpperCase() })} />
            <Field label="Departure time" type="datetime-local" value={form.details.departureTime} onChange={(departureTime) => setDetails({ departureTime })} />
            <Field label="Arrival time" type="datetime-local" value={form.details.arrivalTime} onChange={(arrivalTime) => setDetails({ arrivalTime })} />
            <Field label="Cabin" value={form.details.cabin} onChange={(cabin) => setDetails({ cabin })} />
            <Field label="Confirmation code" value={form.details.confirmationCode} onChange={(confirmationCode) => setDetails({ confirmationCode })} />
          </div>
        </>
      ) : null}
      {form.type === "hotel" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Hotel name" value={form.details.hotelName} onChange={(hotelName) => setDetails({ hotelName })} />
          <Field label="City" value={form.details.city} onChange={(city) => setDetails({ city })} />
          <Field label="Check in" type="date" value={form.details.checkIn} onChange={(checkIn) => setDetails({ checkIn })} />
          <Field label="Check out" type="date" value={form.details.checkOut} onChange={(checkOut) => setDetails({ checkOut })} />
          <Field label="Confirmation code" value={form.details.confirmationCode} onChange={(confirmationCode) => setDetails({ confirmationCode })} />
        </div>
      ) : null}
      {form.type === "transport" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cab type" value={form.details.transportType} onChange={(transportType) => setDetails({ transportType })} />
          <Field label="Pickup" value={form.details.pickupLocation} onChange={(pickupLocation) => setDetails({ pickupLocation })} />
          <Field label="Dropoff" value={form.details.dropoffLocation} onChange={(dropoffLocation) => setDetails({ dropoffLocation })} />
          <Field label="Pickup time" type="datetime-local" value={form.details.pickupTime} onChange={(pickupTime) => setDetails({ pickupTime })} />
          <Field label="Confirmation code" value={form.details.confirmationCode} onChange={(confirmationCode) => setDetails({ confirmationCode })} />
        </div>
      ) : null}
    </>
  );
}

function blankInventoryForm(type) {
  const shared = { type, title: "", subtitle: "", price: { amount: 0, currency: "USD" }, details: {} };
  if (type === "flight") {
    return { ...shared, details: { airline: "", flightNumber: "", origin: "", destination: "", departureTime: "", arrivalTime: "", cabin: "", confirmationCode: "" } };
  }
  if (type === "hotel") {
    return { ...shared, details: { hotelName: "", city: "", checkIn: "", checkOut: "", confirmationCode: "" } };
  }
  return { ...shared, details: { transportType: "", pickupLocation: "", dropoffLocation: "", pickupTime: "", confirmationCode: "" } };
}

function formToInventory(form) {
  return {
    type: form.type,
    title: form.title,
    subtitle: form.subtitle,
    price: { amount: Number(form.price.amount), currency: form.price.currency },
    details: form.details,
    active: true
  };
}

function normalizeItem(item, itinerary) {
  const details = item.details || {};
  const base = { _inventoryId: item._id, status: "booked", price: item.price };
  if (item.type === "flight") {
    return {
      ...base,
      airline: details.airline || item.title,
      flightNumber: details.flightNumber || item.title,
      origin: details.origin || itinerary.origin,
      destination: details.destination || itinerary.destination,
      departureTime: details.departureTime,
      arrivalTime: details.arrivalTime,
      cabin: details.cabin || itinerary.cabin,
      confirmationCode: details.confirmationCode || `FL${Date.now()}`
    };
  }
  if (item.type === "hotel") {
    return {
      ...base,
      hotelName: details.hotelName || item.title,
      city: details.city || itinerary.destination,
      checkIn: details.checkIn || itinerary.departureDate,
      checkOut: details.checkOut || itinerary.returnDate || itinerary.departureDate,
      confirmationCode: details.confirmationCode || `HT${Date.now()}`
    };
  }
  return {
    ...base,
    type: details.transportType || item.title,
    pickupLocation: details.pickupLocation || itinerary.destination,
    dropoffLocation: details.dropoffLocation || "Hotel",
    pickupTime: details.pickupTime,
    confirmationCode: details.confirmationCode || `TX${Date.now()}`
  };
}

function describeInventory(item) {
  const d = item.details || {};
  if (item.type === "flight") return [`${d.origin || "Origin"} to ${d.destination || "Destination"}`, `${formatTime(d.departureTime)} to ${formatTime(d.arrivalTime)}`, d.cabin || "Cabin not set"];
  if (item.type === "hotel") return [d.city || "City not set", `${d.checkIn || "Check-in"} to ${d.checkOut || "Check-out"}`, `Code ${d.confirmationCode || "pending"}`];
  return [`${d.pickupLocation || "Pickup"} to ${d.dropoffLocation || "Dropoff"}`, formatTime(d.pickupTime), d.transportType || "Cab"];
}

function sectionSubtitle(section) {
  if (section === "hotel") return "Search hotels by city, dates, rooms, and guests";
  if (section === "transport") return "Search cabs by pickup, dropoff, time, and passengers";
  if (section === "villa") return "Villa booking can be added by admin inventory later";
  if (section === "holiday") return "Holiday packages are not enabled in this demo";
  if (section === "train") return "Train booking is not enabled in this demo";
  if (section === "insurance") return "Protection is imported with the completed trip";
  return "Search flights by route, date, travellers, and cabin";
}

function missingSearchFields(section, form) {
  const fieldsBySection = {
    flight: [
      ["origin", "origin"],
      ["destination", "destination"],
      ["departureDate", "departure date"]
    ],
    hotel: [
      ["destination", "city or hotel"],
      ["departureDate", "check-in date"],
      ["returnDate", "check-out date"]
    ],
    transport: [
      ["origin", "pickup"],
      ["destination", "dropoff"],
      ["departureDate", "pickup date"]
    ]
  };

  return (fieldsBySection[section] || []).filter(([key]) => !String(form[key] || "").trim()).map(([, label]) => label);
}

function SearchSectionFields({ section, form, setForm }) {
  if (section === "hotel") {
    return (
      <div className="search-grid md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr]">
        <BigField label="City or hotel" value={form.destination} onChange={(destination) => setForm({ ...form, destination })} />
        <BigField label="Check-in" type="date" value={form.departureDate} onChange={(departureDate) => setForm({ ...form, departureDate })} />
        <BigField label="Check-out" type="date" value={form.returnDate} onChange={(returnDate) => setForm({ ...form, returnDate })} />
        <BigField label="Rooms" type="number" value={form.rooms || ""} onChange={(rooms) => setForm({ ...form, rooms })} />
        <BigField label="Guests" type="number" value={form.guests || ""} onChange={(guests) => setForm({ ...form, guests })} />
      </div>
    );
  }

  if (section === "transport") {
    return (
      <div className="search-grid md:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
        <BigField label="Pickup" value={form.origin} onChange={(origin) => setForm({ ...form, origin })} />
        <BigField label="Dropoff" value={form.destination} onChange={(destination) => setForm({ ...form, destination })} />
        <BigField label="Pickup date" type="date" value={form.departureDate} onChange={(departureDate) => setForm({ ...form, departureDate })} />
        <BigField label="Passengers" type="number" value={form.passengers || ""} onChange={(passengers) => setForm({ ...form, passengers })} />
      </div>
    );
  }

  if (!["flight", "hotel", "transport"].includes(section)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <p className="font-semibold">{sectionSubtitle(section)}</p>
        <p className="mt-1 text-sm text-slate-600">Use Flights, Hotels, or Cabs for the current ATRE booking import flow.</p>
      </div>
    );
  }

  return (
    <div className="search-grid md:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.9fr]">
      <BigField label="From city or code" value={form.origin} onChange={(origin) => setForm({ ...form, origin })} />
      <BigField label="To city or code" value={form.destination} onChange={(destination) => setForm({ ...form, destination })} />
      <BigField label="Departure" type="date" value={form.departureDate} onChange={(departureDate) => setForm({ ...form, departureDate })} />
      <BigField label="Return" type="date" value={form.returnDate} onChange={(returnDate) => setForm({ ...form, returnDate })} />
      <BigField label="Cabin Class" value={form.cabin} onChange={(cabin) => setForm({ ...form, cabin })} />
    </div>
  );
}

function BigField({ label, value, onChange, type = "text" }) {
  return (
    <label className="grid min-h-[112px] gap-2 border-b border-r border-slate-200 bg-white p-5 transition hover:bg-sky-50/40 md:border-b-0">
      <span className="text-xs font800 uppercase text-slate-500">{label}</span>
      <input className="min-w-0 bg-transparent text-xl font800 text-ink outline-none placeholder:text-slate-300 md:text-2xl" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="grid gap-2 text-sm font700 text-slate-700">
      {label}
      <input className="input" type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function FlowHeader({ active }) {
  const steps = [["flight", "Flight"], ["hotel", "Hotel"], ["transport", "Cab"], ["checkout", "Checkout"]];
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      {steps.map(([key, label], index) => (
        <div key={key} className={`rounded-lg border px-4 py-3 text-sm font800 shadow-card ${key === active ? "border-amex bg-blue-50 text-amex" : "border-slate-200 bg-white text-slate-500"}`}>
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs">{index + 1}</span>{label}
        </div>
      ))}
    </div>
  );
}

function SelectableCard({ title, subtitle, details, price, icon: Icon, selected, onSelect }) {
  return (
    <article className={`rounded-lg border bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-panel ${selected ? "border-amex ring-2 ring-amex/20" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-amex"><Icon size={21} /></span>
          <div><h3 className="font800">{title}</h3><p className="text-sm text-slate-600">{subtitle}</p></div>
        </div>
        <p className="text-right font800 text-amex">{money(price)}</p>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600">{details.map((detail) => <p className="rounded-md bg-slate-50 px-3 py-2" key={detail}>{detail}</p>)}</div>
      <button onClick={onSelect} className={selected ? "btn-secondary mt-5" : "btn-primary mt-5"} type="button">{selected ? <Check size={18} /> : null}{selected ? "Selected" : "Select"}</button>
    </article>
  );
}

function PageTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-amex shadow-card"><Icon size={23} /></span>
      <div><h1 className="text-2xl font800">{title}</h1><p className="text-slate-600">{subtitle}</p></div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2"><Icon className="text-amex" size={20} /><h2 className="font800">{title}</h2></div>
      {children}
    </section>
  );
}

function SummaryItem({ label, value, price }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3 text-sm">
      <div><p className="font-medium">{label}</p><p className="text-slate-600">{value}</p></div>
      <p className="font-semibold">{money(price)}</p>
    </div>
  );
}

function Alert({ tone, children }) {
  const classes = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700";
  return <p className={`my-4 rounded-lg border p-3 text-sm font700 ${classes}`}>{children}</p>;
}

function EmptyState({ title, message }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-card"><p className="font800">{title}</p><p className="mt-1 text-sm text-slate-600">{message}</p></div>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font800">{title}</h2>
          <button className="btn-secondary" type="button" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const path = usePath();
  const confirmationMatch = path.match(/^\/confirmation\/([^/]+)$/);
  const disruptionMatch = path.match(/^\/admin\/disruptions\/([^/]+)$/);
  const selectMatch = path.match(/^\/select\/(flight|hotel|transport)$/);

  if (path === "/") return <HomePage />;
  if (path === "/login") return <AuthPage mode="login" />;
  if (path === "/register") return <AuthPage mode="register" />;
  if (selectMatch) return <SelectionPage type={selectMatch[1]} />;
  if (path === "/checkout") return <CheckoutPage />;
  if (path === "/bookings") return <MyBookingsPage />;
  if (confirmationMatch) return <ConfirmationPage id={confirmationMatch[1]} />;
  if (path === "/admin/bookings") return <AdminBookingsPage />;
  if (path === "/admin/inventory") return <AdminInventoryPage />;
  if (disruptionMatch) return <AdminDisruptionPage id={disruptionMatch[1]} />;

  return <Navigate to="/" replace />;
}
