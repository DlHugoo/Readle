import B1 from "../../../assets/books/B1.jpg";
import B2 from "../../../assets/books/B2.jpg";
import B3 from "../../../assets/books/B3.jpg";
import B4 from "../../../assets/books/B4.jpg";
import B5 from "../../../assets/books/B5.jpg";

const dummyStoryData = {
  title: "The Lost Puppy",
  images: [
    { id: "img1", url: B1 },
    { id: "img2", url: B2 },
    { id: "img3", url: B3 },
    { id: "img4", url: B4 },
    { id: "img5", url: B5 },
  ],
  correctSequence: ["img1", "img3", "img5", "img2", "img4"],
};

export default dummyStoryData;
