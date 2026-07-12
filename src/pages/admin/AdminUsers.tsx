import { useState, useEffect } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import usersData from "@/data/users.json";
import vehiclesData from "@/data/vehicles.json";
import { User, Vehicle } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "customer" as User["role"]
};

export function AdminUsers() {
  const { language } = useLanguage();
  const { session } = useAuth();
  const { showToast, confirmToast } = useToast();
  const vehicles = vehiclesData as Vehicle[];

  // Load users from storage or auto-reset if storage is outdated
  const [users, setUsers] = useState<User[]>(() => {
    const stored = readStorage<User[]>(storageKeys.users, []);
    if (stored.length === 0) {
      writeStorage(storageKeys.users, usersData as User[]);
      return usersData as User[];
    }
    return stored;
  });

  useEffect(() => {
    writeStorage(storageKeys.users, users);
  }, [users]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "customer" | "admin">("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Create / edit form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUser(null);
    setIsFormOpen(false);
  };

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;

    const emailTaken = users.some(
      (u) => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editingUser?.id
    );
    if (emailTaken) {
      showToast(
        language === "en" ? "A user with this email already exists" : "Bu e-posta ile kayıtlı bir kullanıcı zaten var",
        "error"
      );
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: form.name, email: form.email, phone: form.phone, role: form.role }
            : u
        )
      );
      showToast(language === "en" ? "User updated" : "Kullanıcı güncellendi", "success");
    } else {
      const newUser: User = {
        id: "usr-" + Date.now().toString().slice(-6),
        role: form.role,
        name: form.name,
        email: form.email,
        phone: form.phone,
        ownedVehicleIds: []
      };
      setUsers((prev) => [...prev, newUser]);
      showToast(language === "en" ? "User created" : "Kullanıcı oluşturuldu", "success");
    }
    resetForm();
  };

  const handleDelete = async (u: User) => {
    if (u.id === session?.user.id) {
      showToast(
        language === "en" ? "You cannot delete your own account" : "Kendi hesabınızı silemezsiniz",
        "error"
      );
      return;
    }
    const confirmed = await confirmToast(
      language === "en" ? `Delete ${u.name}'s account?` : `${u.name} adlı kullanıcının hesabı silinsin mi?`,
      {
        confirmLabel: language === "en" ? "Delete" : "Sil",
        cancelLabel: language === "en" ? "Cancel" : "Vazgeç",
        tone: "danger"
      }
    );
    if (!confirmed) return;
    setUsers((prev) => prev.filter((user) => user.id !== u.id));
    if (selectedUser?.id === u.id) setSelectedUser(null);
    showToast(language === "en" ? "User deleted" : "Kullanıcı silindi", "info");
  };

  const filteredUsers = users.filter((u) => {
    const query = search.trim().toLowerCase();
    const searchMatch =
      !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phone.toLowerCase().includes(query);
    const roleMatch = !roleFilter || u.role === roleFilter;
    return searchMatch && roleMatch;
  });

  const ownedVehicleNames = (u: User) =>
    (u.ownedVehicleIds || [])
      .map((id) => vehicles.find((v) => v.id === id)?.name || id)
      .join(", ");

  const roleLabel = (role: User["role"]) =>
    role === "admin"
      ? (language === "en" ? "Admin" : "Yönetici")
      : (language === "en" ? "Customer" : "Müşteri");

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
            {language === "en" ? "Registered Users" : "Kayıtlı Kullanıcılar"}
          </h1>
          <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
            {language === "en"
              ? "Review customer and administrator account lists on the EVALIS platform."
              : "EVALIS platformundaki müşteri ve yönetici hesap listelerini inceleyin."}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="rounded-full bg-accent text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#348c70] transition duration-300 cursor-pointer shrink-0"
        >
          {language === "en" ? "Add User" : "Kullanıcı Ekle"}
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="dash-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Search Users" : "Kullanıcı Ara"}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "en" ? "Name, email, or phone..." : "Ad, e-posta veya telefon..."}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Role" : "Rol"}
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "" | "customer" | "admin")}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          >
            <option value="" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
              {language === "en" ? "All Roles" : "Tüm Roller"}
            </option>
            <option value="customer" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
              {language === "en" ? "Customer" : "Müşteri"}
            </option>
            <option value="admin" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
              {language === "en" ? "Admin" : "Yönetici"}
            </option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="dash-panel overflow-hidden shadow-lg">
        {filteredUsers.length === 0 ? (
          <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-20 font-light">
            {language === "en" ? "No users match this search" : "Bu aramayla eşleşen kullanıcı yok"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-light text-slate-550 dark:text-slate-400">
              <thead className="bg-slate-100/80 dark:bg-[#0e1423]/25 text-slate-650 dark:text-slate-455 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4">{language === "en" ? "User" : "Kullanıcı"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Email" : "E-posta"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Phone" : "Telefon"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Role" : "Rol"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Status" : "Durum"}</th>
                  <th className="px-6 py-4 text-center">{language === "en" ? "Owned Vehicles" : "Sahip Olunan Araçlar"}</th>
                  <th className="px-6 py-4 text-right">{language === "en" ? "Actions" : "İşlemler"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-white/5 font-mono text-[11px]">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-[10px] font-bold uppercase shrink-0 font-sans">
                        {u.name.substring(0, 2)}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-sans">{u.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-350">{u.email}</td>
                    <td className="px-6 py-4 text-slate-500">{u.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase font-sans ${
                        u.role === "admin"
                          ? "bg-red-500/10 border border-red-500/20 text-red-400"
                          : "bg-accent/10 border border-accent/20 text-accent"
                      }`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase font-sans ${
                        (u.ownedVehicleIds?.length || 0) > 0
                          ? "bg-accent/10 border border-accent/20 text-accent"
                          : "bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 text-slate-500"
                      }`}>
                        {(u.ownedVehicleIds?.length || 0) > 0
                          ? (language === "en" ? "Fleet Owner" : "Filo Sahibi")
                          : (language === "en" ? "No Vehicle" : "Araç Yok")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-800 dark:text-slate-200 font-semibold">
                      {u.ownedVehicleIds?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-right font-sans">
                      <div className="flex justify-end gap-2 text-[9px] font-bold uppercase tracking-wider">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(u);
                          }}
                          className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white transition cursor-pointer"
                        >
                          {language === "en" ? "Edit" : "Düzenle"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(u);
                          }}
                          className="px-3 py-1.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        >
                          {language === "en" ? "Delete" : "Sil"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Summary Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="dash-panel max-w-md w-full p-6 space-y-5 shadow-2xl bg-white dark:bg-[#0e1423]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-sm font-bold uppercase shrink-0">
                  {selectedUser.name.substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{selectedUser.name}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase ${
                    selectedUser.role === "admin"
                      ? "bg-red-500/10 border border-red-500/20 text-red-400"
                      : "bg-accent/10 border border-accent/20 text-accent"
                  }`}>
                    {roleLabel(selectedUser.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                aria-label={language === "en" ? "Close" : "Kapat"}
                className="text-slate-450 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                  {language === "en" ? "Email" : "E-posta"}
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                  {language === "en" ? "Phone" : "Telefon"}
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{selectedUser.phone}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold shrink-0">
                  {language === "en" ? "Owned Vehicles" : "Sahip Olunan Araçlar"}
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-200 text-right">
                  {ownedVehicleNames(selectedUser) || (language === "en" ? "None" : "Yok")}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 font-sans text-[10px] font-bold uppercase tracking-wider">
              <button
                onClick={() => {
                  const user = selectedUser;
                  setSelectedUser(null);
                  handleOpenEdit(user);
                }}
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                {language === "en" ? "Edit User" : "Kullanıcıyı Düzenle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit user modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={resetForm}
        >
          <div
            className="dash-panel max-w-md w-full p-6 space-y-6 shadow-2xl bg-white dark:bg-[#0e1423]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
              <h3 className="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">
                {editingUser
                  ? (language === "en" ? "Edit User" : "Kullanıcıyı Düzenle")
                  : (language === "en" ? "Add New User" : "Yeni Kullanıcı Ekle")}
              </h3>
              <button
                onClick={resetForm}
                aria-label={language === "en" ? "Close form" : "Formu kapat"}
                className="text-slate-450 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-light text-slate-700 dark:text-slate-350">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Full Name" : "Ad Soyad"}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Email Address" : "E-posta Adresi"}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Phone Number" : "Telefon Numarası"}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Role" : "Rol"}
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="customer" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
                    {language === "en" ? "Customer" : "Müşteri"}
                  </option>
                  <option value="admin" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
                    {language === "en" ? "Admin" : "Yönetici"}
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2 font-sans text-[10px] font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                  {language === "en" ? "Cancel" : "Vazgeç"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-accent text-black hover:bg-[#348c70] transition"
                >
                  {editingUser
                    ? (language === "en" ? "Save Changes" : "Değişiklikleri Kaydet")
                    : (language === "en" ? "Add User" : "Kullanıcı Ekle")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminUsers;
