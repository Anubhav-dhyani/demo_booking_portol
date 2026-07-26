import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Car,
  Check,
  CircleDollarSign,
  CreditCard,
  LogIn,
  LogOut,
  Plane,
  Search,
  ShieldCheck,
  UserRound
} from "lucide-react";
import {
  clearSession,
  createBooking,
  getBooking,
  getSessionUser,
  listBookings,
  loginAdmin,
  loginUser,
  registerUser,
  saveSession,
  sendFlightCancellation,
  sendFlightDelay
} from "./api.js";
import { flights, hotels, transports } from "./data/travelOptions.js";

const initialTrip = {
  origin: "JFK",
  destination: "SFO",
  departureDate: "2026-08-15",
  returnDate: "2026-08-17",
  tripPurpose: "business"
};

const money = (price) => `$${price.amount.toLocaleString()} ${price.currency}`;
const formatTime = (value) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const bookingId = () => `bk_${Math.floor(1000 + Math.random() * 9000)}`;

function goTo(path, replace = false) {
  if (replace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }

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
  useEffect(() => {
    goTo(to, replace);
  }, [replace, to]);

  return null;
}

function useBookingDraft() {
  const [draft, setDraft] = useState(() => {
    const saved = localStorage.getItem("bookingDraft");
    return saved ? JSON.parse(saved) : { itinerary: initialTrip };
  });

  useEffect(() => {
    localStorage.setItem("bookingDraft", JSON.stringify(draft));
  }, [draft]);

  return [draft, setDraft];
}

function PageShell({ children }) {
  const user = useSession();

  function logout() {
    clearSession();
    goTo("/");
  }

  return (
    <div className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-amex text-white">
              <Plane size={20} />
            </span>
            Demo Travel
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Link className="rounded px-3 py-2 hover:bg-slate-100" to="/">Book</Link>
            <Link className="rounded px-3 py-2 hover:bg-slate-100" to="/admin/bookings">Admin</Link>
            {user ? (
              <>
                <span className="hidden rounded bg-slate-100 px-3 py-2 text-slate-700 md:inline">{user.name}</span>
                <button className="rounded px-3 py-2 hover:bg-slate-100" type="button" onClick={logout}>
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link className="rounded px-3 py-2 hover:bg-slate-100" to="/login">Login</Link>
                <Link className="rounded px-3 py-2 hover:bg-slate-100" to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

function AuthPage({ mode }) {
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const isAdmin = mode === "admin";
  const [form, setForm] = useState({
    name: "Anubhav Dhyani",
    email: isAdmin ? "admin@example.com" : "anubhav@example.com",
    phone: "+15555550123",
    password: isAdmin ? "admin123" : "password123"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = isAdmin
        ? await loginAdmin({ email: form.email, password: form.password })
        : isRegister
          ? await registerUser(form)
          : await loginUser({ email: form.email, password: form.password });
      saveSession(session);
      navigate(isAdmin ? "/admin/bookings" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-md rounded border border-slate-200 bg-white p-6 shadow-panel">
        <div className="mb-5 flex items-center gap-2">
          <LogIn className="text-amex" />
          <h1 className="text-2xl font-semibold">{isAdmin ? "Admin Login" : isRegister ? "Create Account" : "Traveler Login"}</h1>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          {isRegister ? <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} /> : null}
          <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          {isRegister ? <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} /> : null}
          <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
          {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <button className="btn-primary" disabled={loading} type="submit">
            <LogIn size={18} />
            {loading ? "Signing in..." : isRegister ? "Register" : "Login"}
          </button>
        </form>
        {!isAdmin ? (
          <div className="mt-4 flex justify-between text-sm">
            <Link className="font-medium text-amex" to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Use existing account" : "Create traveler account"}
            </Link>
            <Link className="font-medium text-amex" to="/admin/login">Admin login</Link>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}

function Stepper({ active }) {
  const steps = ["Search", "Flight", "Hotel", "Taxi", "Checkout", "Confirm"];

  return (
    <div className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-6">
      {steps.map((step, index) => (
        <div key={step} className={`rounded border px-3 py-2 text-sm ${index <= active ? "border-amex bg-white text-amex" : "border-slate-200 bg-white text-slate-500"}`}>
          {step}
        </div>
      ))}
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useBookingDraft();
  const [form, setForm] = useState(draft.itinerary || initialTrip);

  function submit(event) {
    event.preventDefault();
    setDraft({ itinerary: form });
    navigate("/flights");
  }

  return (
    <PageShell>
      <Stepper active={0} />
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-amex">External booking website</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">Book a protected business trip from search to confirmation.</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">This demo platform books flights, hotels, and taxis, then imports completed booking data into the configured Amex ATRE endpoint.</p>
        </div>
        <form onSubmit={submit} className="rounded border border-slate-200 bg-white p-5 shadow-panel">
          <div className="mb-5 flex items-center gap-2">
            <Search className="text-amex" />
            <h2 className="text-xl font-semibold">Search Trip</h2>
          </div>
          <div className="grid gap-4">
            <Field label="Origin" value={form.origin} onChange={(origin) => setForm({ ...form, origin })} />
            <Field label="Destination" value={form.destination} onChange={(destination) => setForm({ ...form, destination })} />
            <Field label="Departure date" type="date" value={form.departureDate} onChange={(departureDate) => setForm({ ...form, departureDate })} />
            <Field label="Return date" type="date" value={form.returnDate} onChange={(returnDate) => setForm({ ...form, returnDate })} />
            <label className="grid gap-2 text-sm font-medium">
              Trip purpose
              <select className="input" value={form.tripPurpose} onChange={(event) => setForm({ ...form, tripPurpose: event.target.value })}>
                <option value="business">Business</option>
                <option value="conference">Conference</option>
                <option value="client visit">Client visit</option>
              </select>
            </label>
            <button className="btn-primary" type="submit">
              <Search size={18} />
              Search Flights
            </button>
          </div>
        </form>
      </section>
    </PageShell>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectableCard({ title, subtitle, details, price, icon: Icon, selected, onSelect, actionLabel = "Select" }) {
  return (
    <article className={`rounded border bg-white p-5 shadow-sm ${selected ? "border-amex ring-2 ring-amex/20" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-slate-100 text-amex">
            <Icon size={21} />
          </span>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
        <p className="font-semibold">{money(price)}</p>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600">{details.map((detail) => <p key={detail}>{detail}</p>)}</div>
      <button onClick={onSelect} className={selected ? "btn-secondary mt-5" : "btn-primary mt-5"} type="button">
        {selected ? <Check size={18} /> : null}
        {selected ? "Selected" : actionLabel}
      </button>
    </article>
  );
}

function FlightResultsPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useBookingDraft();

  if (!draft.itinerary) return <Navigate to="/" replace />;

  return (
    <PageShell>
      <Stepper active={1} />
      <PageTitle icon={Plane} title="Choose a flight" subtitle={`${draft.itinerary.origin} to ${draft.itinerary.destination} on ${draft.itinerary.departureDate}`} />
      <div className="grid gap-4">
        {flights.map((flight) => (
          <SelectableCard
            key={flight.flightNumber}
            icon={Plane}
            title={`${flight.airline} ${flight.flightNumber}`}
            subtitle={`${flight.cabin} cabin`}
            price={flight.price}
            selected={draft.flight?.flightNumber === flight.flightNumber}
            details={[`${flight.origin} to ${flight.destination}`, `${formatTime(flight.departureTime)} to ${formatTime(flight.arrivalTime)}`]}
            onSelect={() => {
              setDraft({ ...draft, flight: { ...flight, origin: draft.itinerary.origin, destination: draft.itinerary.destination } });
              navigate("/hotels");
            }}
          />
        ))}
      </div>
    </PageShell>
  );
}

function HotelSelectionPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useBookingDraft();
  if (!draft.flight) return <Navigate to="/flights" replace />;

  return (
    <PageShell>
      <Stepper active={2} />
      <PageTitle icon={Building2} title="Choose a hotel" subtitle="Hotels are aligned to the selected trip dates." />
      <div className="grid gap-4 md:grid-cols-3">
        {hotels.map((hotel) => (
          <SelectableCard
            key={hotel.confirmationCode}
            icon={Building2}
            title={hotel.hotelName}
            subtitle={hotel.city}
            price={hotel.price}
            selected={draft.hotel?.confirmationCode === hotel.confirmationCode}
            details={[`${hotel.checkIn} to ${hotel.checkOut}`, `Confirmation ${hotel.confirmationCode}`]}
            onSelect={() => {
              setDraft({ ...draft, hotel });
              navigate("/taxis");
            }}
          />
        ))}
      </div>
    </PageShell>
  );
}

function TaxiSelectionPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useBookingDraft();
  if (!draft.hotel) return <Navigate to="/hotels" replace />;

  return (
    <PageShell>
      <Stepper active={3} />
      <PageTitle icon={Car} title="Choose airport transport" subtitle="Taxi and rideshare options for arrival at SFO." />
      <div className="grid gap-4 md:grid-cols-3">
        {transports.map((transport) => (
          <SelectableCard
            key={transport.confirmationCode}
            icon={Car}
            title={transport.type}
            subtitle={`${transport.pickupLocation} to hotel`}
            price={transport.price}
            selected={draft.transport?.confirmationCode === transport.confirmationCode}
            details={[transport.dropoffLocation, formatTime(transport.pickupTime)]}
            onSelect={() => {
              setDraft({ ...draft, transport: { ...transport, dropoffLocation: draft.hotel.hotelName } });
              navigate("/checkout");
            }}
          />
        ))}
      </div>
    </PageShell>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const sessionUser = useSession();
  const [draft] = useBookingDraft();
  const [traveler, setTraveler] = useState(() => ({
    name: sessionUser?.name || "Anubhav Dhyani",
    email: sessionUser?.email || "anubhav@example.com",
    phone: sessionUser?.phone || "+15555550123"
  }));
  const [payment, setPayment] = useState({ cardBrand: "American Express", last4: "1005" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(() => [draft.flight, draft.hotel, draft.transport].reduce((sum, item) => sum + (item?.price?.amount || 0), 0), [draft]);

  if (!draft.transport) return <Navigate to="/taxis" replace />;
  if (!sessionUser || sessionUser.role !== "user") return <Navigate to="/login" replace />;

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      externalBookingId: bookingId(),
      externalUserId: sessionUser.externalUserId,
      source: "demo-travel-platform",
      user: traveler,
      itinerary: {
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
          location: "Downtown San Francisco",
          startTime: "2026-08-16T09:00:00-07:00",
          endTime: "2026-08-16T10:00:00-07:00"
        }
      ],
      preferences: {
        preferredCabin: draft.flight.cabin,
        maxDelayMinutes: 120,
        preferSameAirline: false,
        allowHotelChanges: true,
        allowTransportChanges: true
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
      <Stepper active={4} />
      <PageTitle icon={CreditCard} title="Checkout" subtitle="Confirm traveler details and payment." />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <Panel title="Traveler" icon={UserRound}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Name" value={traveler.name} onChange={(name) => setTraveler({ ...traveler, name })} />
              <Field label="Email" value={traveler.email} onChange={(email) => setTraveler({ ...traveler, email })} />
              <Field label="Phone" value={traveler.phone} onChange={(phone) => setTraveler({ ...traveler, phone })} />
            </div>
          </Panel>
          <Panel title="Payment" icon={CircleDollarSign}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Card brand" value={payment.cardBrand} onChange={(cardBrand) => setPayment({ ...payment, cardBrand })} />
              <Field label="Last 4" value={payment.last4} onChange={(last4) => setPayment({ ...payment, last4 })} />
            </div>
          </Panel>
          {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </div>
        <Panel title="Trip summary" icon={ShieldCheck}>
          <SummaryItem label="Flight" value={`${draft.flight.airline} ${draft.flight.flightNumber}`} price={draft.flight.price} />
          <SummaryItem label="Hotel" value={draft.hotel.hotelName} price={draft.hotel.price} />
          <SummaryItem label="Taxi" value={draft.transport.type} price={draft.transport.price} />
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${total.toLocaleString()} USD</span>
            </div>
          </div>
          <button className="btn-primary mt-5 w-full" disabled={loading} type="submit">
            <CreditCard size={18} />
            {loading ? "Confirming..." : "Confirm Payment"}
          </button>
        </Panel>
      </form>
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
      <Stepper active={5} />
      <section className="rounded border border-slate-200 bg-white p-8 text-center shadow-panel">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-mint text-white">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-semibold">Your trip has been booked and protected by Amex ATRE.</h1>
        {booking ? (
          <div className="mx-auto mt-6 max-w-2xl rounded bg-slate-50 p-4 text-left text-sm text-slate-700">
            <p><strong>Booking:</strong> {booking.externalBookingId}</p>
            <p><strong>Flight:</strong> {booking.flight.airline} {booking.flight.flightNumber}</p>
            <p><strong>ATRE import:</strong> {booking.atreImport.status}</p>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="btn-secondary" to="/">Book Another Trip</Link>
          <Link className="btn-primary" to="/admin/bookings">Open Admin</Link>
        </div>
      </section>
    </PageShell>
  );
}

function AdminBookingsPage() {
  const sessionUser = useSession();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionUser || sessionUser.role !== "admin") return;

    listBookings().then(setBookings).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [sessionUser]);

  if (!sessionUser || sessionUser.role !== "admin") return <Navigate to="/admin/login" replace />;

  return (
    <PageShell>
      <PageTitle icon={BriefcaseBusiness} title="Admin bookings" subtitle="Bookings created on this demo travel platform." />
      {loading ? <p>Loading bookings...</p> : null}
      {error ? <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4">
        {bookings.map((booking) => (
          <article key={booking._id} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="font-semibold">{booking.externalBookingId}</h2>
                <p className="text-sm text-slate-600">{booking.user.name} · {booking.flight.airline} {booking.flight.flightNumber} · {booking.itinerary.origin} to {booking.itinerary.destination}</p>
              </div>
              <Link className="btn-primary" to={`/admin/disruptions/${booking._id}`}>
                <AlertTriangle size={18} />
                Simulate Disruption
              </Link>
            </div>
          </article>
        ))}
        {!loading && bookings.length === 0 ? (
          <div className="rounded border border-slate-200 bg-white p-8 text-center">
            <p className="font-medium">No bookings yet.</p>
            <Link className="btn-primary mt-4" to="/">Create a Booking</Link>
          </div>
        ) : null}
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

  if (!sessionUser || sessionUser.role !== "admin") return <Navigate to="/admin/login" replace />;

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

  if (!booking && !error) {
    return <PageShell><p>Loading booking...</p></PageShell>;
  }

  return (
    <PageShell>
      <Link className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-amex" to="/admin/bookings">
        <ArrowLeft size={16} />
        Back to bookings
      </Link>
      <PageTitle icon={AlertTriangle} title="Admin disruption simulator" subtitle="Send flight delay or cancellation events to ATRE." />
      {booking ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Panel title="Selected flight" icon={Plane}>
            <p className="text-lg font-semibold">{booking.flight.airline} {booking.flight.flightNumber}</p>
            <p className="text-sm text-slate-600">{booking.itinerary.origin} to {booking.itinerary.destination}</p>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <p><strong>Booking:</strong> {booking.externalBookingId}</p>
              <p><strong>Traveler:</strong> {booking.user.name}</p>
              <p><strong>Departure:</strong> {formatTime(booking.flight.departureTime)}</p>
            </div>
          </Panel>
          <Panel title="Actions" icon={CalendarDays}>
            <div className="grid gap-3">
              <button className="btn-primary w-full" type="button" onClick={() => setModal("delay")}>
                <AlertTriangle size={18} />
                Delay Flight
              </button>
              <button className="btn-danger w-full" type="button" onClick={() => setModal("cancel")}>
                <AlertTriangle size={18} />
                Cancel Flight
              </button>
            </div>
          </Panel>
        </div>
      ) : null}
      {message ? <p className="mt-5 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{message}</p> : null}
      {error ? <p className="mt-5 rounded border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      {modal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded border border-slate-200 bg-white p-5 shadow-panel">
            <h2 className="mb-4 text-lg font-semibold">{modal === "delay" ? "Delay Flight" : "Cancel Flight"}</h2>
            {modal === "delay" ? (
              <div className="grid gap-4">
                <Field label="Delay minutes" type="number" value={delayMinutes} onChange={setDelayMinutes} />
                <Field label="Reason" value={delayReason} onChange={setDelayReason} />
                <div className="flex gap-3">
                  <button className="btn-secondary flex-1" type="button" onClick={() => setModal(null)}>Close</button>
                  <button className="btn-primary flex-1" type="button" onClick={delayFlight}>Submit Delay</button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <Field label="Reason" value={cancelReason} onChange={setCancelReason} />
                <div className="flex gap-3">
                  <button className="btn-secondary flex-1" type="button" onClick={() => setModal(null)}>Close</button>
                  <button className="btn-danger flex-1" type="button" onClick={cancelFlight}>Submit Cancellation</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function PageTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded bg-white text-amex shadow-sm">
        <Icon size={23} />
      </span>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-amex" size={20} />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryItem({ label, value, price }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3 text-sm">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-slate-600">{value}</p>
      </div>
      <p className="font-semibold">{money(price)}</p>
    </div>
  );
}

export default function App() {
  const path = usePath();
  const confirmationMatch = path.match(/^\/confirmation\/([^/]+)$/);
  const disruptionMatch = path.match(/^\/admin\/disruptions\/([^/]+)$/);

  if (path === "/") return <HomePage />;
  if (path === "/login") return <AuthPage mode="login" />;
  if (path === "/register") return <AuthPage mode="register" />;
  if (path === "/admin/login") return <AuthPage mode="admin" />;
  if (path === "/flights") return <FlightResultsPage />;
  if (path === "/hotels") return <HotelSelectionPage />;
  if (path === "/taxis") return <TaxiSelectionPage />;
  if (path === "/checkout") return <CheckoutPage />;
  if (confirmationMatch) return <ConfirmationPage id={confirmationMatch[1]} />;
  if (path === "/admin/bookings") return <AdminBookingsPage />;
  if (disruptionMatch) return <AdminDisruptionPage id={disruptionMatch[1]} />;

  return <Navigate to="/" replace />;
}
