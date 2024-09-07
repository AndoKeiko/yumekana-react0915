import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {ScheduleProps} from '@/Types/index';

const localizer = momentLocalizer(moment);

const Schedule = ({ events }: ScheduleProps) => {
  return (
    <Calendar
    localizer={localizer}
    events={events}
    startAccessor="start"
    endAccessor="end"
    style={{ height: 500 }}
  />
  )
}

export default Schedule