import React, { useState, useEffect } from 'react';
import './App.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Select from 'react-select';
import moment from 'moment';
import { momentLocalizer, Calendar } from 'react-big-calendar';
import getCourseData from './Hooks';

const localizer = momentLocalizer(moment);

function App() {
  const [state, setState] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  useEffect(() => {
    const asyncCourseData = async () => {
      const courseData = await getCourseData();
      setState(courseData);
    };
    asyncCourseData();
  }, []);
  const handleChange = (options) => {
    const newOptions = options === null ? [] : options;
    setSelectedCourses(newOptions);
  };
  const mapToSelectable = (dataPoint) => {
    const { ectsPerQuarter, courseTitle } = dataPoint;
    return {
      value: dataPoint,
      label: `${courseTitle} (${ectsPerQuarter} ECTS)`,
    };
  };
  const getQuarterECTS = (quarterCourses) => {
    const byQuarter = quarterCourses
      .map(mapToSelectable)
      .filter((c) => selectedCourses.map((sc) => sc.label).includes(c.label))
      .map(({ value: { ectsPerQuarter } }) => ectsPerQuarter);
    return byQuarter.reduce((a, b) => a + b, 0);
  };
  const p1Ects = state ? getQuarterECTS(state.p1Courses) : 0;
  const p2Ects = state ? getQuarterECTS(state.p2Courses) : 0;
  const p3Ects = state ? getQuarterECTS(state.p3Courses) : 0;
  const totalEcts = p1Ects + p2Ects + p3Ects;
  const calendarEvents = state
    ? state.courseCalendar
        .filter((course) =>
          selectedCourses
            .map((sc) => sc.value.courseTitle)
            .includes(course.courseTitle)
        )
        .map(({ htmlLink, courseTitle, startTime, endTime }) => ({
          title: courseTitle,
          start: new Date(startTime),
          end: new Date(endTime),
          htmlLink,
        }))
    : [];
  console.log(state);
  return (
    <div className="App">
      <div className="col">
        {state && (
          <>
            <div className="quarter-container">
              <p className="primary">Courses for P1</p>
              <Select
                className="select-container"
                onChange={handleChange}
                value={state.p1Courses
                  .map(mapToSelectable)
                  .filter((c) =>
                    selectedCourses.map((sc) => sc.label).includes(c.label)
                  )}
                isMulti
                options={state.p1Courses.map(mapToSelectable)}
              />
              <p>
                Total ECTS:
                {` ${p1Ects}`}
              </p>
            </div>
            <div className="quarter-container">
              <p className="primary">Courses for P2</p>
              <Select
                className="select-container"
                onChange={handleChange}
                value={state.p2Courses
                  .map(mapToSelectable)
                  .filter((c) =>
                    selectedCourses.map((sc) => sc.label).includes(c.label)
                  )}
                isMulti
                options={state.p2Courses.map(mapToSelectable)}
              />
              <p>
                Total ECTS:
                {` ${p2Ects}`}
              </p>
            </div>
            <div className="quarter-container">
              <p className="primary">Courses for P3</p>
              <Select
                className="select-container"
                value={state.p3Courses
                  .map(mapToSelectable)
                  .filter((c) =>
                    selectedCourses.map((sc) => sc.label).includes(c.label)
                  )}
                onChange={handleChange}
                isMulti
                options={state.p3Courses.map(mapToSelectable)}
              />
              <p>
                Total ECTS:
                {` ${p3Ects}`}
              </p>
            </div>
          </>
        )}
      </div>
      <div className="col" style={{ flex: 3 }}>
        <p>
          Total ECTS:
          {` ${totalEcts}`}
        </p>
        {state && (
          <Calendar
            localizer={localizer}
            defaultView="week"
            onSelectEvent={({ htmlLink }) => window.open(htmlLink, '_blank')}
            min={new Date(2017, 9, 0, 9, 0, 0)}
            max={new Date(2017, 9, 0, 21, 0, 0)}
            events={calendarEvents}
            style={{ marginLeft: '2rem', width: '90%' }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
