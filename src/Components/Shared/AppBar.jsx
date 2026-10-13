import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Image,
  Users,
  FileText,
  Settings,
  FileBarChart,
  TrendingUp,
  Truck,
  ShieldCheck,
  FileCheck,
  UserCheck,
  Sliders,
  PlusCircle,
  Boxes
} from "lucide-react";

function AppBar({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedMenus, setExpandedMenus] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSubMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setExpandedMenus({});
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (item) => {
    if (item.path && location.pathname === item.path) {
      return true;
    }

    if (item.subItems) {
      return item.subItems.some(
        (subItem) => location.pathname === subItem.path
      );
    }

    return false;
  };

  const menuItems = [
    {
      title: "Main",
      items: [
        {
          name: "Dashboard",
          path: "/",
          icon: LayoutDashboard,
        },
        {
          name: "All Orders",
          path: "/orders",
          icon: ShoppingCart,
        },
      ],
    },

    {
      title: "Management",
      items: [
        {
          name: "Product",
          path: "/products",
          icon: Package,
          subItems: [
            {
              name: "View Products",
              path: "/products",
              icon: Boxes,
            },
            {
              name: "Add Products",
              path: "/products/add",
              icon: PlusCircle,
            },
          ],
        },

        {
          name: "Section Management",
          path: "/section",
          icon: Layers,
        },

        {
          name: "Banner",
          path: "/banner",
          icon: Image,
        },

        {
          name: "Users",
          path: "/users",
          icon: Users,
        },

        {
          name: "Policy",
          icon: FileText,
          subItems: [
            {
              name: "Shipping Policy",
              path: "/policy/shipping",
              icon: Truck,
            },
            {
              name: "Privacy Policy",
              path: "/policy/privacy",
              icon: ShieldCheck,
            },
            {
              name: "Term & Conditions",
              path: "/policy/terms",
              icon: FileCheck,
            },
          ],
        },

        {
          name: "Settings",
          icon: Settings,
          subItems: [
            {
              name: "Admin Users",
              path: "/admin/users",
              icon: UserCheck,
            },
            {
              name: "Admin Settings",
              path: "/admin/settings",
              icon: Sliders,
            },
          ],
        },
      ],
    },

    {
      title: "System",
      items: [
        {
          name: "Reports",
          path: "/reports",
          icon: FileBarChart,
        },
        {
          name: "Analytics",
          path: "/analytics",
          icon: TrendingUp,
        },
      ],
    },
  ];

  const topNavItems = [
    {
      name: "All Orders",
      path: "/orders",
      icon: ShoppingCart,
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
      subItems: [
        {
          name: "View Products",
          path: "/products",
          icon: Boxes,
        },
        {
          name: "Add Products",
          path: "/products/add",
          icon: PlusCircle,
        },
      ],
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileBarChart,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      {/* =====================================================
          TOP APP BAR
      ====================================================== */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-white shadow-sm">

        <div className="mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">

          {/* =================================================
              LEFT SIDE
          ================================================== */}
          <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:w-[260px] me-0" : "lg:w-[200px] me-5"}`}>
            {/* Logo */}
            <div className="flex flex-shrink-0 items-center">
              <NavLink
                to="/"
                className="flex items-center gap-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white">
                  A
                </div>

                <span className="hidden font-jakarta text-[19px] font-bold text-gray-900 sm:block">
                  Admin Panel
                </span>
              </NavLink>
            </div>
            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition-all duration-200 hover:bg-tertiary/10 hover:text-gray-900"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* =================================================
              TOP NAVIGATION
          ================================================== */}
          <nav className={`hidden flex-1 items-center gap-1 lg:flex transition-all duration-300 ease-in-out ${sidebarOpen ? "ms-5 lg:ms-8" : "ms-5"}`}>

            {topNavItems.map((item) => {
              const hasSubItems =
                item.subItems && item.subItems.length > 0;

              const active = isParentActive(item);

              if (hasSubItems) {
                return (
                  <div
                    key={item.name}
                    className="group relative"
                  >

                    {/* Parent */}
                    <div
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-inter text-[16px] font-semibold transition-all duration-200 ${active
                        ? "bg-tertiary/20 text-gray-900"
                        : "text-secondary hover:bg-tertiary/10 hover:text-gray-900"
                        }`}
                    >
                      {item.icon && <item.icon size={18} className="shrink-0" />}
                      <span>{item.name}</span>

                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    <div className="absolute left-0 top-full h-2 w-full" />

                    {/* Dropdown */}
                    <div
                      className="invisible absolute left-0 top-[calc(100%+8px)] z-50 w-56 translate-y-1 overflow-hidden rounded-xl bg-white p-1.5 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
                    >
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.path}
                          className={({ isActive: navActive }) =>
                            `flex items-center gap-2.5 rounded-lg px-3 py-2 font-inter text-[13.5px] transition-all duration-200 ${navActive
                              ? "bg-tertiary/20 font-bold text-gray-900"
                              : "font-semibold text-secondary hover:bg-tertiary/10 hover:text-gray-900"
                            }`
                          }
                        >
                          {subItem.icon ? (
                            <subItem.icon size={14} className={`shrink-0 ${isActive(subItem.path) ? "text-primary" : "text-secondary/70"}`} />
                          ) : (
                            <span
                              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isActive(subItem.path)
                                ? "bg-primary"
                                : "bg-tertiary"
                                }`}
                            />
                          )}

                          <span>{subItem.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              }

              /*
               * Normal top navigation item
               */
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive: navActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 font-inter text-[16px] font-semibold transition-all duration-200 ${navActive
                      ? "bg-tertiary/20 text-gray-900"
                      : "text-secondary hover:bg-tertiary/10 hover:text-gray-900"
                    }`
                  }
                >
                  {item.icon && <item.icon size={18} className="shrink-0" />}
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}
          <div className="ml-auto flex items-center gap-2">

            {/* Notification */}
            <button
              type="button"
              title="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition hover:bg-tertiary/10 hover:text-gray-900"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* =================================================
              PROFILE
            ================================================== */}
            <div className="group relative">

              <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-tertiary/10">

                {/* Avatar */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary/30 text-sm font-semibold text-gray-900">
                  A
                </div>

                {/* User */}
                <div className="hidden text-left xl:block">
                  <p className="font-inter text-[13px] font-semibold text-gray-900">
                    Admin
                  </p>

                  <p className="font-inter text-[11px] text-gray-500">
                    Administrator
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  className="h-4 w-4 text-tertiary transition-transform duration-200 group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Hover bridge */}
              <div className="absolute right-0 top-full h-2 w-56" />

              {/* Profile dropdown */}
              <div
                className="invisible absolute right-0 top-[calc(100%+8px)] z-50 w-56 translate-y-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
              >
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 font-inter text-[13px] font-medium transition ${isActive
                      ? "bg-tertiary/10 text-gray-900"
                      : "text-secondary hover:bg-tertiary/10 hover:text-gray-900"
                    }`
                  }
                >
                  <svg
                    className="h-5 w-5 text-tertiary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 20.25a7.5 7.5 0 0115 0"
                    />
                  </svg>

                  <span>Profile</span>
                </NavLink>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 font-inter text-[13px] font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 12H9m0 0l3-3m-3 3l3 3"
                    />
                  </svg>

                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* =====================================================
          SIDEBAR OVERLAY (MOBILE ONLY)
      ====================================================== */}
      <div
        className={`fixed inset-0 z-[60] bg-black/30 lg:hidden transition-opacity duration-300 ${sidebarOpen
          ? "visible opacity-100"
          : "invisible opacity-0"
          }`}
        onClick={closeSidebar}
      />


      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`fixed left-0 top-0 z-[70] h-screen w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${sidebarOpen
          ? "translate-x-0"
          : "-translate-x-full"
          }`}
      >

        {/* =================================================
            SIDEBAR HEADER
        ================================================== */}
        <div className="flex h-16 items-center justify-between px-4">

          <NavLink
            to="/"
            onClick={closeSidebar}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white">
              A
            </div>

            <span className="font-jakarta text-[19px] font-bold text-gray-900">
              Admin Panel
            </span>
          </NavLink>

          {/* Close */}
          <button
            type="button"
            onClick={closeSidebar}
            title="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition hover:bg-tertiary/10 hover:text-gray-900"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>


        {/* =================================================
            SIDEBAR NAVIGATION
        ================================================== */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">

          {menuItems.map((section) => (
            <div
              key={section.title}
              className="mb-5"
            >

              {/* Section title */}
              <p className="mb-2 px-3 font-inter text-[12px] font-bold uppercase tracking-wider text-secondary/60">
                {section.title}
              </p>

              <ul className="space-y-1">

                {section.items.map((item) => {
                  const hasSubItems =
                    item.subItems &&
                    item.subItems.length > 0;

                  const active = isParentActive(item);

                  const isExpanded =
                    expandedMenus[item.name];

                  /*
                   * ITEM WITH SUBMENU
                   */
                  if (hasSubItems) {
                    return (
                      <li key={item.name}>

                        <button
                          type="button"
                          onClick={() =>
                            toggleSubMenu(item.name)
                          }
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-inter text-[14px] font-semibold transition-all duration-200 ${active
                            ? "bg-tertiary/20 text-gray-900"
                            : "text-secondary hover:bg-tertiary/10 hover:text-gray-900"
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {item.icon && <item.icon size={19} className="shrink-0" />}
                            <span>{item.name}</span>
                          </div>

                          <svg
                            className={`h-4 w-4 transition-transform duration-200 ${isExpanded
                              ? "rotate-180"
                              : ""
                              }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Submenu */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ${isExpanded
                            ? "mt-1 max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                            }`}
                        >
                          <div className="ml-3 space-y-1 pl-3">

                            {item.subItems.map(
                              (subItem) => (
                                <NavLink
                                  key={subItem.name}
                                  to={subItem.path}
                                  onClick={closeSidebar}
                                  className={({ isActive: subActive }) =>
                                    `flex items-center gap-2.5 rounded-lg px-3 py-2 font-inter text-[13px] transition-all duration-200 ${subActive
                                      ? "bg-tertiary/20 font-bold text-gray-900"
                                      : "font-semibold text-secondary/80 hover:bg-tertiary/10 hover:text-gray-900"
                                    }`
                                  }
                                >
                                  {subItem.icon ? (
                                    <subItem.icon size={16} className={`shrink-0 ${isActive(subItem.path) ? "text-primary" : "text-secondary/70"}`} />
                                  ) : (
                                    <span
                                      className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isActive(
                                        subItem.path
                                      )
                                        ? "bg-primary"
                                        : "bg-tertiary"
                                        }`}
                                    />
                                  )}

                                  <span>
                                    {subItem.name}
                                  </span>
                                </NavLink>
                              )
                            )}

                          </div>
                        </div>
                      </li>
                    );
                  }

                  /*
                   * NORMAL ITEM
                   */
                  return (
                    <li key={item.name}>

                      <NavLink
                        to={item.path}
                        onClick={closeSidebar}
                        className={({ isActive: navActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-3 py-2 font-inter text-[14px] font-semibold transition-all duration-200 ${navActive
                            ? "bg-tertiary/20 text-gray-900"
                            : "text-secondary hover:bg-tertiary/10 hover:text-gray-900"
                          }`
                        }
                      >
                        {item.icon && <item.icon size={19} className="shrink-0" />}
                        <span>{item.name}</span>
                      </NavLink>

                    </li>
                  );
                })}

              </ul>
            </div>
          ))}

        </nav>
      </aside>

      {/* =====================================================
          MAIN CONTENT AREA
      ====================================================== */}
      <main
        className={`min-h-screen bg-white transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-72" : "ml-0"
          }`}
      >
        {children}
      </main>
    </>
  );
}

export default AppBar;

