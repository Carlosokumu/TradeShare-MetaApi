const getTimeDifference = (dateString) => {
  const currentDate = new Date();
  const targetDate = new Date(dateString);
  const timeDifference = currentDate - targetDate;
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  if (daysDifference === 0) {
    return "today";
  } else if (daysDifference === 1) {
    return "yesterday";
  } else if (daysDifference <= 7) {
    return `${daysDifference} days ago`;
  } else if (daysDifference <= 30) {
    const weeks = Math.floor(daysDifference / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else {
    const months = Math.floor(daysDifference / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
};

module.exports = getTimeDifference;
