const platformName = 'StudyMatch'
const numberOfStudents = 12
let isOpen = true

console.log(`Welcome to ${platformName}! We have ${numberOfStudents} students currently registered.`)
isOpen = false

if (isOpen) {
  console.log('StudyMatch is open.')
} else {
  console.log('StudyMatch is closed.')
}
// Exercise 2.2 - Arrays and Loops

const students = [
  'Alice',
  'John',
  'Marie',
  'Sarah',
  'Adam'
]
let index = 1

for (const student of students) {
  console.log(`Student #${index}: ${student}`)
  index++
}
students.push('Emma')

console.log('Updated number of students:', students.length)
function findStudent (name) {
  if (students.includes(name)) {
    return 'Student found'
  } else {
    return 'Student not found'
  }
}

console.log(findStudent('Alice'))
console.log(findStudent('David'))
// Exercise 2.3 - Objects and Nested Data

const student = {
  name: 'Alice Martin',
  age: 22,
  interests: ['Mathematics', 'Programming'],
  mentor: {
    name: 'John Smith',
    specialty: 'Data Science'
  }
}
console.log('Mentor name:', student.mentor.name)

console.log('Number of interests:', student.interests.length)

console.log(
    `${student.name} is mentored by ${student.mentor.name} (${student.mentor.specialty}).`
)
student.interests.push('Artificial Intelligence')

console.log('Updated student:', student)
// Exercise 2.4 - Functions and Array Filtering

const studentList = [
  { id: 1, name: 'Alice', age: 22 },
  { id: 2, name: 'John', age: 25 },
  { id: 3, name: 'Marie', age: 20 }
]
function filterByAge (minAge) {
  return studentList.filter(student => student.age > minAge)
}

console.log('Students older than 21:', filterByAge(21))
function addStudent (name, age) {
  const newStudent = {
    id: studentList.length + 1,
    name,
    age
  }

  studentList.push(newStudent)
}

addStudent('Emma', 23)

console.log('Updated student list:', studentList)
// Exercise 2.6 - Error Handling and Validation

function createStudySession (student, subject, date) {
  if (!student || !subject || !date) {
    throw new Error('Missing required fields')
  }

  return { student, subject, date }
}
try {
  console.log(
    createStudySession('Alice', 'Mathematics', '2026-11-10')
  )

  console.log(
    createStudySession('John')
  )
} catch (err) {
  console.error('Error:', err.message)
}
// Exercise 2.7 - Asynchronous Code

function getStudyMatchData () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: 'StudyMatch',
        students: 120
      })
    }, 1000)
  })
}
async function showData () {
  console.log('Fetching StudyMatch data...')

  const data = await getStudyMatchData()

  console.log('Data loaded:', data)
}

showData()
