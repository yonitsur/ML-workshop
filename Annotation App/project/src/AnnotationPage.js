import React, { useEffect, useRef, useState } from "react";
import { getAnnotations, postAnnotation } from "./api";

function AnnotationPage() {
  // get the user name from the url
  const user = window.location.href.split("/").pop();

  const categoryButtons = [
    "Background",
    "Carton",
    "Ceramics",
    "Concrete",
    "Gypsum",
    "Glass",
    "Metal (general)",
    "Metal (iron bender)",
    "Metal (pipe)",
    "Nylon",
    "Paper",
    "Plastic (general)",
    "Plastic (big bag)",
    "Plastic (bucket)",
    "Plastic (pipe)",
    "Plastic (sand bag)",
    "Rubber",
    "Styrofoam",
    "Textile",
    "Unknown",
    "Wood (pallet)",
    "Wood (scraps/cuttings)",
  ];

  const [imagesData, setImagesData] = useState(null);
  const [images, setImageList] = useState([]);
  const [splitImagesData, setSplitImagesData] = useState(null);
  const [boxesData, setBoxesData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSplit, setSelectedSplit] = useState(0);
  const [selectedMask, setSelectedMask] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [totalImages, setTotalImages] = useState(null);
  const [annotationsUpdated, setAnnotationsUpdated] = useState(false);
  const [maskCategorySelections, setMaskCategorySelections] = useState({});
  const [maskList, setMaskList] = useState([]);
  const maskImage = useRef(null);
  const nextButton = useRef(null);
  const prevButton = useRef(null);

  const splits = [
    "split_0",
    "split_1",
    "split_2",
    "split_3",
    "split_4",
    "split_5",
    "split_6",
    "split_7",
    "split_8",
    "split_9",
    "split_10",
    "split_11",
    "split_12",
    "split_13",
    "split_14",
    "split_15",
  ];

  // function setInitialTotalImages() {
  //   if (imagesData && images[selectedImage]) {
  //     const im_key = images[selectedImage];
  //     const sp_key = `split_${selectedSplit}`;
  //     if (sp_key in imagesData[im_key]) {
  //       const maskList_ = Object.keys(imagesData[im_key][sp_key]);
  //       const masksInSplit = maskList_.length;
  //       // put maskList_ in the global maskList
  //       setMaskList(maskList_);
  //       setTotalImages(masksInSplit);
  //     } else {
  //       setTotalImages(0);
  //     }
  //   } else {
  //     setTotalImages(0);
  //   }
  //   console.log("maskList:", maskList);
  // }

  function setInitialTotalImages() {
    if (imagesData && images[selectedImage]) {
      const im_key = images[selectedImage];
      const sp_key = `split_${selectedSplit}`;
      if (sp_key in imagesData[im_key]) {
        const maskList_ = Object.keys(imagesData[im_key][sp_key]);
        const sortedMaskList = maskList_.sort((a, b) => {
          const boxA = boxesData[im_key][sp_key][a];
          const boxB = boxesData[im_key][sp_key][b];
          const areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
          const areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);
          return areaB - areaA;
        });
        setMaskList(sortedMaskList);
        setTotalImages(sortedMaskList.length);
      } else {
        setTotalImages(0);
      }
    } else {
      setTotalImages(0);
    }
    //console.log("maskList:", maskList);
  }


  function getMaskCategorySelections(image_idx, split_idx, mask_idx) {
    getAnnotations(images[image_idx], splits[split_idx])
      .then((response) => {
        const annotations = response.data;
        if (annotations === null) {
          setMaskCategorySelections({});
          return;
        }
        if (maskList[mask_idx] in annotations) {
          setSelectedCategory(annotations[maskList[mask_idx]]);
        } else {
          setSelectedCategory(null);
        }
        setMaskCategorySelections(annotations);
        //console.log("annotations:", annotations);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function imgchange(event) {
    setSelectedCategory(null);
    setSelectedImage(event.target.value);
    setSelectedSplit(0);
    setSelectedMask(0);
    setInitialTotalImages();
    getMaskCategorySelections(event.target.value, 0, 0);
  }

  function spchange(event) {
    setSelectedCategory(null);
    setSelectedSplit(event.target.value);
    setSelectedMask(0);
    setInitialTotalImages();
    getMaskCategorySelections(selectedImage, event.target.value, 0);
  }

  function updateAndSaveAnnotations() {
    if (annotationsUpdated) {
      const annotationData = {
        image: images[selectedImage],
        split: splits[selectedSplit],
        mask: maskList[selectedMask],
        selectedCategory,
      };

      //console.log("Annotation Data:", annotationData);

      postAnnotation(annotationData)
        .then((response) => {
          //console.log(response.data);
          setAnnotationsUpdated(false); // Reset the flag after saving annotations
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  useEffect(() => {
    updateAndSaveAnnotations();
  });

  // Function to handle category button clicks and set the selected category
  function onCategoryButtonClick(category) {
    setSelectedCategory(category);
    setAnnotationsUpdated(true); // Set the flag when annotations are updated
    setMaskCategorySelections((prevSelections) => ({
      ...prevSelections,
      [maskList[selectedMask]]: category,
    }));
  }

  function displayImage(im_key, sp_key, msk_key) {
    if (imagesData) {
      if (im_key in imagesData) {
        const imageObject = imagesData[im_key][sp_key];
        if (msk_key in imageObject) {
          const imageURL = imageObject[msk_key];
          maskImage.current.src = imageURL;
        }
      }
    }
  }

  // fun
  // useEffect(() => {

  useEffect(() => {
    fetch(`/images_${user}.json`)
      .then((response) => response.json())
      .then((data) => setImageList(data["images"]));
  }, [user]);


  useEffect(() => {
    fetch(`/masks_${user}.json`)
      .then((response) => response.json())
      .then((data) => setImagesData(data));
  }, [user]);

   useEffect(() => {
     fetch(`/boxes_${user}.json`)
       .then((response) => response.json())
       .then((data) => setBoxesData(data));
   }, [user]);

  useEffect(() => {
    fetch(`/splits_${user}.json`)
      .then((response) => response.json())
      .then((data) => setSplitImagesData(data));
  }, [user]);

  useEffect(() => {
    setInitialTotalImages();
  });

  useEffect(() => {
    function displaySelectedImage() {
      if (imagesData) {
        const im_key = images[selectedImage];
        const sp_key = `split_${selectedSplit}`;
        const msk_key = maskList[selectedMask];
        displayImage(im_key, sp_key, msk_key);
      }
    }

    function displaySelectedSplitImage() {
      if (splitImagesData && images[selectedImage]) {
        const splitImageURL =
          splitImagesData[images[selectedImage]][`split_${selectedSplit}`];
        document.getElementById("split-image").src = splitImageURL;
      }
    }

    function removeDisplayedBox() {
      const existingBox = document.querySelector(".split-box");
      if (existingBox) {
        existingBox.parentNode.removeChild(existingBox);
      }
    }

    function displaySelectedMaskBox() {
      if (boxesData && images[selectedImage]) {
        // console.log("selectedMask:", selectedMask);
        // console.log("maskList:", maskList);
        const boxData =
          boxesData[images[selectedImage]][`split_${selectedSplit}`][
            maskList[selectedMask]
          ];
        if (boxData) {
          const [x1, y1, x2, y2] = boxData;
          const splitImageElement = document.getElementById("split-image");
          if (splitImageElement) {
            const boxWidth = x2 - x1;
            const boxHeight = y2 - y1;
            const boxLeft = x1;
            const boxTop = y1;
            const existingBox = document.querySelector(".split-box");
            if (existingBox) {
              existingBox.style.width = `${boxWidth}px`;
              existingBox.style.height = `${boxHeight}px`;
              existingBox.style.left = `${boxLeft}px`;
              existingBox.style.top = `${boxTop}px`;
              existingBox.style.position = "absolute";
              existingBox.style.border = "4px solid red";
            } else {
              const boxElement = document.createElement("div");
              boxElement.className = "split-box";
              boxElement.style.width = `${boxWidth}px`;
              boxElement.style.height = `${boxHeight}px`;
              boxElement.style.left = `${boxLeft}px`;
              boxElement.style.top = `${boxTop}px`;
              boxElement.style.position = "absolute";
              boxElement.style.border = "5px solid red";
              splitImageElement.parentNode.appendChild(boxElement);
            }
          }
        } else {
          removeDisplayedBox();
        }
      } else {
        removeDisplayedBox();
      }
    }
    displaySelectedImage();
    displaySelectedSplitImage();
    displaySelectedMaskBox();
  });

  function showNextMask() {
    if (selectedMask < totalImages - 1) {
      setSelectedMask((prevSelectedMask) => prevSelectedMask + 1);
    }
  }

  function showPrevMask() {
    if (selectedMask > 0) {
      setSelectedMask((prevSelectedMask) => prevSelectedMask - 1);
    }
  }

  useEffect(() => {
    function handleKeyPress(event) {
      switch (event.key) {
        case "ArrowRight":
          showNextMask();
          break;
        case "ArrowLeft":
          showPrevMask();
          break;
        default:
          break;
      }
    }

    // Add event listener for keydown event
    document.addEventListener("keydown", handleKeyPress);

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  });

  useEffect(() => {
    const nextButtonRef = nextButton.current;
    const prevButtonRef = prevButton.current;

    // Add event listeners using the local variables
    if (nextButtonRef) {
      nextButtonRef.addEventListener("click", showNextMask);
    }
    if (prevButtonRef) {
      prevButtonRef.addEventListener("click", showPrevMask);
    }

    // Cleanup function to remove event listeners
    return () => {
      if (nextButtonRef) {
        nextButtonRef.removeEventListener("click", showNextMask);
      }
      if (prevButtonRef) {
        prevButtonRef.removeEventListener("click", showPrevMask);
      }
    };
  });

  function getButtonStyle(category) {
    if (maskList[selectedMask] in maskCategorySelections) {
      if (maskCategorySelections[maskList[selectedMask]] === category) {
        return {
          backgroundColor: "#09223b",
          color: "white",
        };
      }
    }
    return {};
  }

  return (
    <div className="App" style={{ fontSize: "20px" }}>
      <div>
        <label htmlFor="imageSelect" className="imageSplitLabelStyle">
          Image:{" "}
        </label>
        <select
          id="imageSelect"
          className="selectionBoxStyle"
          value={selectedImage}
          onChange={imgchange}
        >
          {images.map((imageKey, index) => (
            <option key={index} value={index}>
              {imageKey}
            </option>
          ))}
        </select>
        <label htmlFor="splitSelect" className="imageSplitLabelStyle">
          Split:{" "}
        </label>
        <select
          id="splitSelect"
          className="selectionBoxStyle"
          value={selectedSplit}
          onChange={spchange}
        >
          {splits.map((splitKey, index) => (
            <option key={index} value={index}>
              {splitKey}
            </option>
          ))}
        </select>
      </div>
      <div id="split-container" style={{ position: "relative" }}>
        <img id="split-image" src="" alt="" />
        <img
          id="mask-image"
          ref={maskImage}
          src=""
          alt=""
          style={{ padding: "0px 30px" }}
        />
      </div>

      <div id="mask-container" style={{ position: "relative" }}></div>
      <div
        id="buttons-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          maxWidth: "1700px", // Adjust the maximum width as needed
        }}
      >
        {categoryButtons.map((category, index) => {
          return (
            <button
              key={index}
              className="button-18"
              onClick={() => onCategoryButtonClick(category)}
              style={getButtonStyle(category)}
            >
              {category}
            </button>
          );
        })}
      </div>
      <div id="mask-container4">
        <div>
          <button className="button-32" ref={prevButton} id="prevButton">
            Prev
          </button>
          <text
            style={{ fontSize: "30px", fontWeight: "bold", margin: "10px" }}
          >
            Mask: {selectedMask+1}/ {totalImages} ({maskList[selectedMask]})
          </text>
          <button className="button-32" ref={nextButton} id="nextButton">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnnotationPage;
