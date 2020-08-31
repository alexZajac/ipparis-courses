import axios from 'axios';

const months = [
  'september',
  'october',
  'november',
  'december',
  'january',
  'february',
  'march',
  'april',
];
const timeMonths = [
  '2020-09',
  '2020-10',
  '2020-11',
  '2020-12',
  '2021-01',
  '2021-02',
  '2021-03',
  '2021-04',
  '2021-05',
];
const halfECTSCourses = [
  'Hidden Markov models and Sequential Monte Carlo methods N.Chopin ENSAE',
  'Enchères et matching : apprentissage et approximations V.Perchet ENSAE',
  'Statistical Learning Theory J.Mourtada ENSAE',
  'High dimensional statistics A.Tsybakov ENSAE',
];
export const notCourses = [
  'Examens P1',
  'EXAMENS',
  'Examens',
  'Congés',
  'Départ en stage',
  'Cours intensifs',
  'P1',
  'P2',
  'P3',
  'Remise à niveau ',
  'Journée de rentrée',
  'FERIE',
  'CONGES ',
  'Examen Deep learning I G.Peeters',
];

const p1End = new Date('2020-11-15T23:00:00');
const p2End = new Date('2021-01-31T23:00:00');

const getQuarter = (startTime) => {
  const compareDate = new Date(startTime);
  if (compareDate < p1End) return 'P1';
  if (compareDate < p2End) return 'P2';
  return 'P3';
};

const getEctsPerQuarter = (courseTitle) => {
  if (halfECTSCourses.includes(courseTitle)) return 1.25;
  if (courseTitle === 'Data Camp') return 5;
  return 2.5;
};

export const mapToSelectable = (dataPoint) => {
  const { ectsPerQuarter, courseTitle } = dataPoint;
  return {
    value: dataPoint,
    label: `${courseTitle} (${ectsPerQuarter} ECTS per quarter)`,
  };
};

export const mapToCalendar = ({
  htmlLink,
  courseTitle,
  startTime,
  endTime,
}) => ({
  title: courseTitle,
  start: new Date(startTime),
  end: new Date(endTime),
  htmlLink,
});

export const minDate = new Date(1965, 9, 0, 9, 0, 0);
export const maxDate = new Date(2017, 8, 0, 20, 0, 0);

const getCourseData = async () => {
  const courseCalendar = await Promise.all(
    months.map(async (_, i) => {
      const response = await axios.get(
        `https://clients6.google.com/calendar/v3/calendars/1rs7sh06s9nerdi7v2rg754g1g@group.calendar.google.com/events?calendarId=1rs7sh06s9nerdi7v2rg754g1g%40group.calendar.google.com&singleEvents=true&timeZone=Europe%2FParis&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=${
          timeMonths[i]
        }-03T00%3A00%3A00%2B02%3A00&timeMax=${
          timeMonths[i + 1]
        }-07T00%3A00%3A00%2B02%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs`
      );
      const {
        data: { items },
      } = response;
      const monthItems = [];
      items.forEach((item) => {
        const {
          htmlLink,
          summary,
          start: { dateTime: startTime },
          end: { dateTime: endTime },
        } = item;
        const courseTitle = summary.replace(/\t/g, '');
        const ectsPerQuarter = getEctsPerQuarter(courseTitle);
        monthItems.push({
          htmlLink,
          courseTitle,
          startTime,
          endTime,
          ectsPerQuarter,
        });
      });
      return monthItems;
    })
  );
  const concatenatedCalendar = [].concat(...courseCalendar);
  const coursePerQuarter = {
    P1: new Set(),
    P2: new Set(),
    P3: new Set(),
  };
  concatenatedCalendar.forEach(({ courseTitle, ectsPerQuarter, startTime }) => {
    if (!notCourses.includes(courseTitle)) {
      const quarter = getQuarter(startTime);
      coursePerQuarter[quarter].add(
        JSON.stringify({ ectsPerQuarter, courseTitle, quarter })
      );
    }
  });
  const p1Courses = [...coursePerQuarter.P1].map((dataPoint) =>
    JSON.parse(dataPoint)
  );
  const p2Courses = [...coursePerQuarter.P2].map((dataPoint) =>
    JSON.parse(dataPoint)
  );
  const p3Courses = [...coursePerQuarter.P3].map((dataPoint) =>
    JSON.parse(dataPoint)
  );
  return {
    p1Courses,
    p2Courses,
    p3Courses,
    courseCalendar: concatenatedCalendar,
  };
};

export default getCourseData;
