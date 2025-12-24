"""
SingleMotionDetector Module
---------------------------
This module implements background subtraction–based
motion detection using frame averaging and contour analysis.

Used as part of a real-time surveillance web application.
"""


# ---------------------------------------------------------------------------------------------------

import numpy as np
import imutils
import cv2

# ---------------------------------------------------------------------------------------------------

class SingleMotionDetector:

	# -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

	def __init__(self, accumWeight=0.5):

		# Store the accumulated weight factor
		self.accumWeight = accumWeight

		# Initialize the background model
		self.bg = None

	# -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

	def update(self, image):

		# If the background model is None, initialize it
		if self.bg is None:
			self.bg = image.copy().astype("float")
			return

		# Update the background model by accumulating the weighted average
		cv2.accumulateWeighted(image, self.bg, self.accumWeight)

	# -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

	def detect(self, image, tVal=25):

		# Compute the absolute difference between the background model and the image passed in, then threshold the delta image
		delta = cv2.absdiff(self.bg.astype("uint8"), image)
		thresh = cv2.threshold(delta, tVal, 255, cv2.THRESH_BINARY)[1]

		# Perform a series of erosions and dilations to remove small blobs
		thresh = cv2.erode(thresh, None, iterations=2)
		thresh = cv2.dilate(thresh, None, iterations=2)

		# Find contours in the thresholded image and initialize the minimum and maximum bounding box regions for motion
		cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
			cv2.CHAIN_APPROX_SIMPLE)
		cnts = imutils.grab_contours(cnts)
		(minX, minY) = (np.inf, np.inf)
		(maxX, maxY) = (-np.inf, -np.inf)

		# If no contours were found, return None
		if len(cnts) == 0:
			return None

		# Otherwise, loop over the contours
		for c in cnts:

			# Compute the bounding box of the contour and use it to update the minimum and maximum bounding box regions
			(x, y, w, h) = cv2.boundingRect(c)
			(minX, minY) = (min(minX, x), min(minY, y))
			(maxX, maxY) = (max(maxX, x + w), max(maxY, y + h))

		# Otherwise, return a tuple of the thresholded image along with bounding box
		return (thresh, (minX, minY, maxX, maxY))