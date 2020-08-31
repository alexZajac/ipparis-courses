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
  const [selectedP1Courses, setSelectedP1Courses] = useState([]);
  const [selectedP2Courses, setSelectedP2Courses] = useState([]);
  const [selectedP3Courses, setSelectedP3Courses] = useState([]);
  const [globalSelection, setGlobalSelection] = useState([]);
  // effects
  useEffect(() => {
    const setAsyncCourseData = async () => {
      const courseData = await getCourseData();
      setState(courseData);
    };
    setAsyncCourseData();
  }, []);
  // set global selection of courses titles
  useEffect(() => {
    const newSelection = new Set([
      ...selectedP1Courses.map(({ value: { courseTitle } }) => courseTitle),
      ...selectedP2Courses.map(({ value: { courseTitle } }) => courseTitle),
      ...selectedP3Courses.map(({ value: { courseTitle } }) => courseTitle),
    ]);
    setGlobalSelection([...newSelection]);
  }, [selectedP1Courses, selectedP2Courses, selectedP3Courses]);
  // update courses on multiple quarters
  useEffect(() => {
    const toReselectP1 = p1Courses.filter(({ courseTitle }) =>
      globalSelection.includes(courseTitle)
    );
    const toReselectP2 = p2Courses.filter(({ courseTitle }) =>
      globalSelection.includes(courseTitle)
    );
    const toReselectP3 = p3Courses.filter(({ courseTitle }) =>
      globalSelection.includes(courseTitle)
    );
    if (selectedP1Courses.length !== toReselectP1.length)
      setSelectedP1Courses(toReselectP1.map(mapToSelectable));
    if (selectedP2Courses.length !== toReselectP2.length)
      setSelectedP2Courses(toReselectP2.map(mapToSelectable));
    if (selectedP3Courses.length !== toReselectP3.length)
      setSelectedP3Courses(toReselectP3.map(mapToSelectable));
  }, [
    globalSelection,
    p1Courses,
    p2Courses,
    p3Courses,
    selectedP1Courses.length,
    selectedP2Courses.length,
    selectedP3Courses.length,
  ]);
  // methods
  const filterCalendar = useCallback(
    ({ courseTitle }) =>
      [...globalSelection, ...notCourses].includes(courseTitle),
    [globalSelection]
  );
  const filterDuplicateCourses = useCallback(
    (v, i, a) =>
      a.findIndex(
        ({ courseTitle, startTime, endTime }) =>
          courseTitle === v.courseTitle &&
          startTime === v.startTime &&
          endTime === v.endTime
      ) === i,
    []
  );
  const getQuarterECTS = useCallback(
    (quarterCourses) =>
      quarterCourses
        .map(({ value: { ectsPerQuarter } }) => ectsPerQuarter)
        .reduce((a, b) => a + b, 0),
    []
  );
  // computed values
  const p1Ects = useMemo(() => getQuarterECTS(selectedP1Courses), [
    selectedP1Courses,
    getQuarterECTS,
  ]);
  const p2Ects = useMemo(() => getQuarterECTS(selectedP2Courses), [
    selectedP2Courses,
    getQuarterECTS,
  ]);
  const p3Ects = useMemo(() => getQuarterECTS(selectedP3Courses), [
    selectedP3Courses,
    getQuarterECTS,
  ]);
  const totalEcts = p1Ects + p2Ects + p3Ects;
  const calendarEvents = useMemo(
    () =>
      courseCalendar
        .filter(filterCalendar)
        .filter(filterDuplicateCourses)
        .map(mapToCalendar),
    [courseCalendar, filterCalendar, filterDuplicateCourses]
  );

  const Quarter = ({ name, courses, selectedCourses, ects, requiredEcts }) => {
    const courseOptions = useMemo(() => courses.map(mapToSelectable), [
      courses,
    ]);
    const handleChange = useCallback(
      (options) => {
        const newOptions = options === null ? [] : options;
        // removing
        if (newOptions.length < selectedCourses.length) {
          const {
            value: { courseTitle: removedTitle },
          } = selectedCourses.filter((c) => !newOptions.includes(c))[0];
          setGlobalSelection(globalSelection.filter((s) => s !== removedTitle));
        } else {
          const {
            value: { courseTitle: addedTitle },
          } = newOptions.filter((c) => !selectedCourses.includes(c))[0];
          setGlobalSelection([...globalSelection, addedTitle]);
        }
      },
      [selectedCourses]
    );
    return (
      <div className="quarter-container">
        <p className="primary">{`Courses for ${name}`}</p>
        <Select
          className="select-container"
          placeholder={`Pick courses for ${name}...`}
          onChange={handleChange}
          value={selectedCourses}
          isMulti
          options={courseOptions}
        />
        <p>{`Total ECTS: ${ects} (out of ${requiredEcts})`}</p>
      </div>
    );
  };
  return (
    <div className="App">
      <div className="col">
        <Quarter
          name="P1"
          courses={p1Courses}
          selectedCourses={selectedP1Courses}
          ects={p1Ects}
          requiredEcts={20}
        />
        <Quarter
          name="P2"
          courses={p2Courses}
          selectedCourses={selectedP2Courses}
          ects={p2Ects}
          requiredEcts={10}
        />
        <Quarter
          name="P3"
          courses={p3Courses}
          selectedCourses={selectedP3Courses}
          ects={p3Ects}
          requiredEcts={10}
        />
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
