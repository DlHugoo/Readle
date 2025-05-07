import B1 from "../../../assets/books/B1.jpg";
import B2 from "../../../assets/books/B2.jpg";
import B3 from "../../../assets/books/B3.jpg";
import B4 from "../../../assets/books/B4.jpg";

const dummyStoryData = {
  title: "The Lost Puppy",
  images: [
    { id: "img1", url: B1 },
    { id: "img2", url: B2 },
    { id: "img3", url: B3 },
    { id: "img4", url: B4 },
  ],
  correctSequence: ["img1", "img3", "img2", "img4"],
};

export default dummyStoryData;
