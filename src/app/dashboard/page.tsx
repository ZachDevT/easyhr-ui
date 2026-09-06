"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  FileSignature,
  GripVertical,
  LayoutDashboard,
  Plus,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { MAX_WIDGETS, useWidgets } from "@/context/WidgetContext";
import {
  CompulsoryMyTimeWidget,
  CompulsoryTimeOffWidget,
  OPTIONAL_WIDGETS,
  WIDGET_MAP,
} from "@/components/widgets";
import { Modal } from "@/components/ui/Modal";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const { currentUser, role } = useRole();
  const { activeWidgets, addWidget, removeWidget, reorderWidgets } =
    useWidgets();
  const [isEditing, setIsEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
  const initials = `${currentUser.firstName[0]}${currentUser.lastName[0]}`;

  const handleDragStart = (event: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    event.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    reorderWidgets(draggedIdx, index);
    setDraggedIdx(index);
  };
  const toggleWidget = (id: string) =>
    activeWidgets.includes(id) ? removeWidget(id) : addWidget(id);

  return (
    <div className={styles.dashboard}>
      <section className={styles.welcome}>
        <div className={styles.greeting}>
          <div className={styles.avatar}>
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={fullName} />
            ) : (
              initials
            )}
            <i />
          </div>
          <div>
            <span className={styles.eyebrow}>
              Your workspace · Monday, 2 September
            </span>
            <h1>Good morning, {currentUser.firstName}.</h1>
            <p>
              Here&apos;s a clear view of your day, your requests, and the
              moments that need you.
            </p>
          </div>
        </div>
        <div className={styles.welcomeActions}>
          <Link href="/time-off">
            <CalendarDays /> Request leave
          </Link>
          <button
            onClick={() => setIsEditing((current) => !current)}
            className={isEditing ? styles.editing : ""}
          >
            <SlidersHorizontal /> {isEditing ? "Done" : "Personalise"}{" "}
            <span>
              {activeWidgets.length}/{MAX_WIDGETS}
            </span>
          </button>
        </div>
      </section>

      <section className={styles.focusStrip}>
        <div className={styles.focusTitle}>
          <span>
            <Sparkles />
          </span>
          <div>
            <b>Today&apos;s focus</b>
            <small>Three useful next steps, without the noise.</small>
          </div>
        </div>
        <Link href="/my-signatures" className={styles.focusAction}>
          <span className={styles.focusNumber}>01</span>
          <div>
            <b>Sign your offer addendum</b>
            <small>Document waiting for your signature</small>
          </div>
          <ChevronRight />
        </Link>
        <Link href="/time-off" className={styles.focusAction}>
          <span className={styles.focusNumber}>02</span>
          <div>
            <b>Plan your October leave</b>
            <small>18 vacation hours available</small>
          </div>
          <ChevronRight />
        </Link>
        <Link href="/my-onboarding" className={styles.focusAction}>
          <span className={styles.focusNumber}>03</span>
          <div>
            <b>Complete your profile</b>
            <small>One detail left to add</small>
          </div>
          <ChevronRight />
        </Link>
      </section>

      <section className={styles.workspace}>
        <div className={styles.mainColumn}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Run your day</span>
              <h2>Your essentials</h2>
            </div>
            <Link href="/time">
              View time history <ArrowRight />
            </Link>
          </div>
          <div className={styles.essentials}>
            <div className={styles.timeCard}>
              <CompulsoryMyTimeWidget />
            </div>
            <div className={styles.leaveCard}>
              <CompulsoryTimeOffWidget />
            </div>
          </div>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Keep in the loop</span>
              <h2>Your company pulse</h2>
            </div>
            <button onClick={() => setPickerOpen(true)}>
              <Plus /> Add a view
            </button>
          </div>
          <div className={styles.widgetGrid}>
            {activeWidgets.length === 0 && (
              <div className={styles.empty}>
                <LayoutDashboard />
                <b>Make this space yours</b>
                <p>
                  Add the company updates, celebrations, and reminders most
                  useful to you.
                </p>
                <button onClick={() => setPickerOpen(true)}>
                  Choose views
                </button>
              </div>
            )}
            {activeWidgets.map((id, index) => {
              const Widget = WIDGET_MAP[id];
              if (!Widget) return null;
              return (
                <div
                  key={id}
                  className={styles.widgetShell}
                  draggable={isEditing}
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDragEnd={() => setDraggedIdx(null)}
                  style={{ opacity: draggedIdx === index ? 0.45 : 1 }}
                >
                  {isEditing && (
                    <div className={styles.dragHint}>
                      <GripVertical /> Drag to reorder
                    </div>
                  )}
                  <Widget
                    onRemove={isEditing ? () => removeWidget(id) : undefined}
                  />
                  {isEditing && (
                    <button
                      className={styles.removeWidget}
                      aria-label={`Remove ${id}`}
                      onClick={() => removeWidget(id)}
                    >
                      <X />
                    </button>
                  )}
                </div>
              );
            })}
            {isEditing &&
              Array.from({ length: MAX_WIDGETS - activeWidgets.length }).map(
                (_, index) => (
                  <button
                    key={index}
                    className={styles.addSlot}
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus />
                    <span>Add a view</span>
                  </button>
                ),
              )}
          </div>
        </div>
        <aside className={styles.sideColumn}>
          <article className={styles.profileCard}>
            <div className={styles.profileTop}>
              <span className={styles.profileIcon}>{initials}</span>
              <button aria-label="Profile options">•••</button>
            </div>
            <span className={styles.eyebrow}>My profile</span>
            <h3>{fullName}</h3>
            <p>
              {currentUser.title} · {currentUser.department}
            </p>
            <div className={styles.profileProgress}>
              <span>
                <b>80%</b> complete
              </span>
              <i>
                <em />
              </i>
            </div>
            <Link href="/people/me">
              Complete profile <ArrowRight />
            </Link>
          </article>
          <article className={styles.upcoming}>
            <header>
              <div>
                <span className={styles.eyebrow}>Coming up</span>
                <h3>Your week</h3>
              </div>
              <Link href="/time-off">Calendar</Link>
            </header>
            <div className={styles.event}>
              <span>
                <b>04</b>
                <small>SEP</small>
              </span>
              <div>
                <b>Marketing stand-up</b>
                <small>09:30 · Main meeting room</small>
              </div>
            </div>
            <div className={styles.event}>
              <span>
                <b>05</b>
                <small>SEP</small>
              </span>
              <div>
                <b>Grace&apos;s birthday</b>
                <small>Send a note or celebrate together</small>
              </div>
            </div>
            <div className={styles.event}>
              <span>
                <b>06</b>
                <small>SEP</small>
              </span>
              <div>
                <b>Company all-hands</b>
                <small>15:00 · Company-wide</small>
              </div>
            </div>
          </article>
          {role !== "Employee" && (
            <article className={styles.rolePrompt}>
              <FileSignature />
              <div>
                <span>{role} workspace</span>
                <b>
                  {role === "Manager"
                    ? "Your team has 3 items waiting."
                    : "People operations are in motion."}
                </b>
                <Link href={role === "Manager" ? "/team-requests" : "/inbox"}>
                  Review now <ArrowRight />
                </Link>
              </div>
            </article>
          )}
        </aside>
      </section>
      <Modal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Personalise your home"
        footer={
          <button
            className="btn-primary w-full"
            onClick={() => setPickerOpen(false)}
          >
            Done
          </button>
        }
      >
        <p className={styles.modalIntro}>
          Choose up to {MAX_WIDGETS} views. Your time and leave essentials
          always stay visible.
        </p>
        <div className={styles.widgetPicker}>
          {OPTIONAL_WIDGETS.map((widget) => {
            const selected = activeWidgets.includes(widget.id);
            const disabled = !selected && activeWidgets.length >= MAX_WIDGETS;
            return (
              <button
                type="button"
                key={widget.id}
                disabled={disabled}
                className={`${styles.pickerOption} ${selected ? styles.pickerSelected : ""}`}
                onClick={() => toggleWidget(widget.id)}
              >
                <span>{widget.icon}</span>
                <div>
                  <b>{widget.label}</b>
                  <small>{widget.desc}</small>
                </div>
                {selected ? <Check /> : <Plus />}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
