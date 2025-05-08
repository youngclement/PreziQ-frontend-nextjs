"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LocationQuestionEditor } from "../collection/components/question-editor/location-question-editor";
import { LocationQuestionPlayer } from "../collection/components/question-editor/location-question-player";
import { QuizQuestion } from "../collection/components/types";
import { ArrowLeft, Edit, PlayCircle, Globe, Map } from "lucide-react";

// Mock data cho location quiz
const MOCK_LOCATION_QUESTIONS: QuizQuestion[] = [
  {
    id: "geo1",
    activity_id: "act_geo1",
    question_text: "Tìm và đánh dấu vị trí của Hà Nội trên bản đồ",
    question_type: "location",
    options: [],
    correct_answer_text: "",
    location_data: {
      lat: 21.028511,
      lng: 105.804817,
      radius: 20,
      hint: "Thủ đô của Việt Nam"
    }
  },
  {
    id: "geo2",
    activity_id: "act_geo1",
    question_text: "Tìm và đánh dấu vị trí của TP. Hồ Chí Minh trên bản đồ",
    question_type: "location",
    options: [],
    correct_answer_text: "",
    location_data: {
      lat: 10.762622,
      lng: 106.660172,
      radius: 20,
      hint: "Thành phố lớn nhất Việt Nam"
    }
  },
  {
    id: "geo3",
    activity_id: "act_geo1",
    question_text: "Tìm và đánh dấu vị trí của Paris trên bản đồ",
    question_type: "location",
    options: [],
    correct_answer_text: "",
    location_data: {
      lat: 48.856614,
      lng: 2.352222,
      radius: 20,
      hint: "Thủ đô của Pháp"
    }
  },
  {
    id: "geo4",
    activity_id: "act_geo1",
    question_text: "Tìm và đánh dấu vị trí của Tokyo trên bản đồ",
    question_type: "location",
    options: [],
    correct_answer_text: "",
    location_data: {
      lat: 35.689487,
      lng: 139.691711,
      radius: 25,
      hint: "Thủ đô của Nhật Bản"
    }
  },
  {
    id: "geo5",
    activity_id: "act_geo1",
    question_text: "Tìm và đánh dấu vị trí của New York trên bản đồ",
    question_type: "location",
    options: [],
    correct_answer_text: "",
    location_data: {
      lat: 40.712776,
      lng: -74.005974,
      radius: 25,
      hint: "Thành phố lớn nhất của Hoa Kỳ"
    }
  }
];

export default function LocationQuizTest() {
  const [activeTab, setActiveTab] = useState<string>("intro"); // Bắt đầu với intro
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>(MOCK_LOCATION_QUESTIONS);
  const [score, setScore] = useState<number>(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number>(0);

  // Xử lý khi thay đổi vị trí trong editor
  const handleLocationChange = (locationData: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex].location_data = locationData;
    setQuestions(updatedQuestions);
    console.log("Location updated:", locationData);
  };

  // Xử lý khi người dùng trả lời câu hỏi
  const handleAnswerQuestion = (isCorrect: boolean, distance: number) => {
    console.log(`Answered: ${isCorrect ? "Correct" : "Incorrect"}, Distance: ${distance.toFixed(2)}km`);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setAnsweredQuestions(prev => prev + 1);
  };

  // Di chuyển đến câu hỏi tiếp theo
  const handleNextQuestion = () => {
    if (activeQuestionIndex < questions.length - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    }
  };

  // Di chuyển đến câu hỏi trước đó
  const handlePrevQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  return (
    <div className="container mx-auto py-8 mt-20">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" asChild>
            <a href="/">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Geography Location Quiz</h1>
            <p className="text-muted-foreground">Tìm vị trí địa lý trên bản đồ 3D của trái đất</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab("intro")}
            className={activeTab === "intro" ? "border-primary bg-primary/10" : ""}
          >
            <Globe className="mr-2 h-4 w-4" />
            Giới thiệu
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("edit")}
            className={activeTab === "edit" ? "border-primary bg-primary/10" : ""}
          >
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("play")}
            className={activeTab === "play" ? "border-primary bg-primary/10" : ""}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Thử thách
          </Button>
        </div>
      </div>

      {activeTab === "intro" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Globe className="mr-2 h-5 w-5 text-blue-500" />
                Tạo quiz địa lý với bản đồ 3D
              </CardTitle>
              <CardDescription>
                Quiz địa lý với bản đồ 3D trái đất sử dụng Mapbox GL JS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Với tính năng này, bạn có thể tạo các câu hỏi địa lý yêu cầu người dùng định vị các địa điểm trên bản đồ 3D của trái đất. Người chơi sẽ tương tác với bản đồ để:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tìm và đánh dấu các thành phố, thủ đô, địa danh nổi tiếng</li>
                <li>Khám phá các vị trí địa lý với bản đồ 3D hiển thị địa hình thực tế</li>
                <li>Học địa lý theo cách tương tác và trực quan nhất</li>
              </ul>
              <p className="font-medium text-blue-600 dark:text-blue-400">
                Hãy thử mở chế độ chỉnh sửa hoặc thử thách từ các nút phía trên!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Map className="mr-2 h-5 w-5 text-green-500" />
                Tính năng chính
              </CardTitle>
              <CardDescription>
                Các tính năng độc đáo của quiz địa lý
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400">1</div>
                  <div>
                    <p className="font-medium">Bản đồ 3D với địa hình</p>
                    <p className="text-muted-foreground text-sm">Hiển thị địa hình thực tế với độ cao, địa hình núi non và đồng bằng</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3 text-green-600 dark:text-green-400">2</div>
                  <div>
                    <p className="font-medium">Đo khoảng cách chính xác</p>
                    <p className="text-muted-foreground text-sm">Tính toán khoảng cách giữa vị trí đã chọn và vị trí đúng theo km</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3 text-purple-600 dark:text-purple-400">3</div>
                  <div>
                    <p className="font-medium">Bán kính linh hoạt</p>
                    <p className="text-muted-foreground text-sm">Thiết lập bán kính chấp nhận để định nghĩa độ khó của câu hỏi</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3 text-amber-600 dark:text-amber-400">4</div>
                  <div>
                    <p className="font-medium">Tìm kiếm địa điểm</p>
                    <p className="text-muted-foreground text-sm">Tìm kiếm nhanh các địa điểm trên toàn thế giới khi tạo câu hỏi</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {(activeTab === "edit" || activeTab === "play") && (
        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar - Question list */}
          <div className="col-span-12 md:col-span-3">
            <Card>
              <CardHeader className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20">
                <CardTitle className="text-sm font-medium">Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      className={`w-full p-3 text-left flex items-center text-sm hover:bg-muted/50 ${index === activeQuestionIndex ? "bg-muted" : ""
                        }`}
                      onClick={() => setActiveQuestionIndex(index)}
                    >
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1 truncate">
                        {question.question_text.length > 40
                          ? question.question_text.substring(0, 40) + "..."
                          : question.question_text}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {activeTab === "play" && (
              <Card className="mt-4">
                <CardHeader className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                  <CardTitle className="text-sm font-medium">Score</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{score} / {answeredQuestions}</div>
                    <div className="text-sm text-muted-foreground">correct answers</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: answeredQuestions > 0 ? `${(score / answeredQuestions) * 100}%` : "0%"
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main content */}
          <div className="col-span-12 md:col-span-9">
            {questions[activeQuestionIndex] && activeTab === "edit" && (
              <div>
                <h2 className="text-xl font-semibold mb-3">
                  Question {activeQuestionIndex + 1}: Location Editor
                </h2>
                <LocationQuestionEditor
                  questionText={questions[activeQuestionIndex].question_text}
                  locationData={questions[activeQuestionIndex].location_data || { lat: 21.028511, lng: 105.804817, radius: 10 }}
                  onLocationChange={handleLocationChange}
                  readonly={false}
                />

                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevQuestion}
                    disabled={activeQuestionIndex === 0}
                  >
                    Previous Question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextQuestion}
                    disabled={activeQuestionIndex === questions.length - 1}
                  >
                    Next Question
                  </Button>
                </div>
              </div>
            )}

            {questions[activeQuestionIndex] && activeTab === "play" && (
              <div>
                <h2 className="text-xl font-semibold mb-3">
                  Question {activeQuestionIndex + 1}: Player View
                </h2>
                <LocationQuestionPlayer
                  questionText={questions[activeQuestionIndex].question_text}
                  locationData={questions[activeQuestionIndex].location_data || { lat: 21.028511, lng: 105.804817, radius: 10 }}
                  onAnswer={handleAnswerQuestion}
                />

                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevQuestion}
                    disabled={activeQuestionIndex === 0}
                  >
                    Previous Question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextQuestion}
                    disabled={activeQuestionIndex === questions.length - 1}
                  >
                    Next Question
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}