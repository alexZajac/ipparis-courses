import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Select from 'react-select';
import moment from 'moment';
import { momentLocalizer, Calendar } from 'react-big-calendar';
import getCourseData, {
  mapToCalendar,
  mapToSelectable,
  notCourses,
  minDate,
  maxDate,
} from './Utils';

const localizer = momentLocalizer(moment);
const initialState = {
  p1Courses: [],
  p2Courses: [],
  p3Courses: [],
  courseCalendar: [],
};

function App() {
  // state
  const [
    { p1Courses, p2Courses, p3Courses, courseCalendar },
    setState,
  ] = useState(initialState);
  const [selectedCourses, setSelectedCourses] = useState([]);
  // effects
  useEffect(() => {
    const setAsyncCourseData = async () => {
      const courseData = await getCourseData();
      setState(courseData);
    };
    setAsyncCourseData();
  }, []);
  // methods
  const handleChange = (options) => {
    const newOptions = options === null ? [] : options;
    setSelectedCourses(newOptions);
  };
  const filterByLabel = useCallback(
    ({ label }) =>
      selectedCourses
        .map(({ label: compareLabel }) => compareLabel)
        .includes(label),
    [selectedCourses]
  );
  const filterSelectedByTitle = useCallback(
    ({ courseTitle }) =>
      selectedCourses
        .map(({ value: { courseTitle: title } }) => title)
        .includes(courseTitle),
    [selectedCourses]
  );
  const filterCalendar = useCallback(
    (course) =>
      filterSelectedByTitle(course) || notCourses.includes(course.courseTitle),
    [filterSelectedByTitle]
  );
  const filterDuplicateCourses = (v, i, a) =>
    a.findIndex(({ courseTitle }) => courseTitle === v.courseTitle) === i;
  const getQuarterECTS = useCallback(
    (quarterCourses) =>
      quarterCourses
        .filter(filterSelectedByTitle)
        .map(({ ectsPerQuarter }) => ectsPerQuarter)
        .reduce((a, b) => a + b, 0),
    [filterSelectedByTitle]
  );
  // computed values
  const p1Ects = useMemo(() => getQuarterECTS(p1Courses), [
    p1Courses,
    getQuarterECTS,
  ]);
  const p2Ects = useMemo(() => getQuarterECTS(p2Courses), [
    p2Courses,
    getQuarterECTS,
  ]);
  const p3Ects = useMemo(() => getQuarterECTS(p3Courses), [
    p3Courses,
    getQuarterECTS,
  ]);
  const totalEcts = p1Ects + p2Ects + p3Ects;
  const calendarEvents = useMemo(
    () =>
      courseCalendar
        .filter(filterCalendar)
        .filter(filterDuplicateCourses)
        .map(mapToCalendar),
    [courseCalendar, filterCalendar]
  );

  const Quarter = ({ name, courses, ects }) => {
    const courseOptions = useMemo(() => courses.map(mapToSelectable), [
      courses,
    ]);
    const quarterCourses = useMemo(() => courseOptions.filter(filterByLabel), [
      courseOptions,
    ]);
    return (
      <div className="quarter-container">
        <p className="primary">{`Courses for ${name}`}</p>
        <Select
          className="select-container"
          placeholder={`Pick courses for ${name}...`}
          onChange={handleChange}
          value={quarterCourses}
          isMulti
          options={courseOptions}
        />
        <p>{`Total ECTS for ${name}: ${ects}`}</p>
      </div>
    );
  };
  return (
    <div className="App">
      <div className="col">
        <Quarter name="P1" courses={p1Courses} ects={p1Ects} />
        <Quarter name="P2" courses={p2Courses} ects={p2Ects} />
        <Quarter name="P3" courses={p3Courses} ects={p3Ects} />
      </div>
      <div className="col" style={{ flex: 3 }}>
        <p>{`Total ECTS: ${totalEcts} (out of 40)`}</p>
        <Calendar
          localizer={localizer}
          defaultView="week"
          onSelectEvent={({ htmlLink }) => window.open(htmlLink, '_blank')}
          min={minDate}
          max={maxDate}
          events={calendarEvents}
          style={{ marginLeft: '2rem', width: '90%' }}
        />
      </div>
    </div>
  );
}

export default App;
