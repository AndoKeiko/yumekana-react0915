'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import { Task } from '@/Types/index'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScheduleComponentProps {
  tasks: Task[]
  hoursPerDay: number
  startTime: string
}

export default function ScheduleComponent({ 
  tasks, 
  hoursPerDay = 8, 
  startTime = "09:00" 
}: ScheduleComponentProps) {
  const [calendar, setCalendar] = useState<Calendar | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [localHoursPerDay, setLocalHoursPerDay] = useState(hoursPerDay)
  const [localStartTime, setLocalStartTime] = useState(startTime)
  const [events, setEvents] = useState<any[]>([])

  const generateSchedule = useCallback((tasks: Task[], hoursPerDay: number, startTime: string) => {
    if (!Array.isArray(tasks)) {
      console.error('Tasks is not an array:', tasks)
      return []
    }

    const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0))
    let currentDate = moment().startOf('day')
    const events = []

    for (const task of sortedTasks) {
      let remainingTime = task.taskTime || 0
      while (remainingTime > 0) {
        const availableTime = Math.min(remainingTime, hoursPerDay)
        const [hours, minutes] = startTime.split(':').map(Number)
        const taskStart = moment(currentDate).set({ hour: hours, minute: minutes })
        const taskEnd = moment(taskStart).add(availableTime, 'hours')

        events.push({
          title: task.name || task.taskName || 'Unnamed Task',
          start: taskStart.toDate(),
          end: taskEnd.toDate(),
          extendedProps: {
            description: task.description || '',
            priority: task.taskPriority || 0
          }
        })

        remainingTime -= availableTime
        currentDate = currentDate.add(1, 'day')
      }
    }

    return events
  }, [])

  useEffect(() => {
    if (Array.isArray(tasks) && tasks.length > 0) {
      const newEvents = generateSchedule(tasks, localHoursPerDay, localStartTime)
      setEvents(newEvents)
    }
  }, [tasks, localHoursPerDay, localStartTime, generateSchedule])

  useEffect(() => {
    const calendarEl = document.getElementById('calendar')
    if (calendarEl) {
      const newCalendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events, // generateSchedule(tasks, localHoursPerDay, localStartTime)の代わりにeventsを使用
        eventClick: (info) => {
          alert(`タスク: ${info.event.title}\n説明: ${info.event.extendedProps.description}\n優先度: ${info.event.extendedProps.priority}`)
        }
      })
      newCalendar.render()
      setCalendar(newCalendar)
    }

    return () => {
      if (calendar) {
        calendar.destroy()
      }
    }
  }, [events])

  useEffect(() => {
    if (calendar && selectedDate) {
      calendar.gotoDate(selectedDate)
    }
  }, [selectedDate, calendar])

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleApplySettings = () => {
    if (calendar) {
      calendar.removeAllEvents()
      calendar.addEventSource(generateSchedule(tasks, localHoursPerDay, localStartTime))
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">スケジュール</h2>
      <div className="flex space-x-4 items-end">
        <div>
          <Label htmlFor="datePicker">日付選択</Label>
          <DatePicker
            id="datePicker"
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy/MM/dd"
            className="p-2 border rounded"
          />
        </div>
        <div>
          <Label htmlFor="hoursPerDay">1日の作業時間</Label>
          <Input
            id="hoursPerDay"
            type="number"
            value={localHoursPerDay}
            onChange={(e) => setLocalHoursPerDay(Number(e.target.value))}
            min={1}
            max={24}
          />
        </div>
        <div>
          <Label htmlFor="startTime">開始時間</Label>
          <Input
            id="startTime"
            type="time"
            value={localStartTime}
            onChange={(e) => setLocalStartTime(e.target.value)}
          />
        </div>
        <Button onClick={handleApplySettings}>設定を適用</Button>
      </div>
      <div id="calendar" className="h-[600px]" />
    </div>
  )
}