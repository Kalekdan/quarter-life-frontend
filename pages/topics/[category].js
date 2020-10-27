import Layout from "@/components/layout";
import {
  getTopicByCategory,
  getCategories,
  getAllQuestionsForForum,
} from "@/lib/api";
import Head from "next/head";
import React, { useContext, useEffect, useState } from "react";
import Footer from "@/components/footer";
import ForumPost from "@/components/forumPost";
import Link from "next/link";
import markdownToHtml from "@/lib/markdownToHtml";
import styles from "./category.module.css";
import markdownStyles from "../../components/markdown-styles.module.css";
import { Button, Spinner } from "@chakra-ui/core";
import AppContext from "context/AppContext";

export default function Category({ topic, content }) {
  const [questionsList, setQuestionsList] = useState(null);
  const appContext = useContext(AppContext);
  const [upvotedQuestions, setUpvotedQuestions] = useState([]);

  const { user } = appContext;

  function toPost(question, index) {
    let highlight = false;
    console.log("generating posts");

    upvotedQuestions.forEach((upvote) => {
      console.log(upvote);
      if (question.id == upvote.question.id) {
        highlight = true;
      }
    });

    return (
      <ForumPost
        key={index}
        props={question}
        highlight={highlight}
        me={user}
        upvotedQuestions={appContext.upvotes}
        setUpvotedQuestions={appContext.setUpvotes}
      ></ForumPost>
    );
  }

  useEffect(() => {
    async function getPosts() {
      const forumPosts = (await getAllQuestionsForForum()) || [];
      setQuestionsList(forumPosts.map(toPost));
    }
    getPosts();
    return function del() {};
  }, [upvotedQuestions]);

  useEffect(() => {
    console.log(appContext);
    setUpvotedQuestions(
      appContext.upvotes.filter((upvote) => {
        return upvote.question && upvote.question != null;
      })
    );
    return () => {};
  }, [appContext]);

  const title = topic
    ? topic.topics[0].category.charAt(0).toUpperCase() +
      topic.topics[0].category.slice(1)
    : "Topic";

  function BlogPosts() {
    if (topic) {
      const postList = topic.posts.map((post, index) => {
        return (
          <Link
            className={styles.blogLink}
            key={index}
            href={"/posts/" + post.slug}
          >
            <div
              className={
                styles.blogLink + " flex max-h-14 justify-between  p-2"
              }
            >
              <h1
                style={{ wordWrap: "break-word", maxWidth: "80%" }}
                className="mt-auto mb-auto text-xl"
              >
                {index + 1 + ". " + post.title}
              </h1>
              <img
                src={`${
                  post.coverImage.url.startsWith("/")
                    ? process.env.NEXT_PUBLIC_STRAPI_API_URL
                    : ""
                }${post.coverImage.url}`}
                className="w-16 h-19"
              />
            </div>
          </Link>
        );
      });
      return postList;
    } else return [];
  }
  return (
    <>
      <Layout>
        <Head>
          <title>{title + " | 20sos"}</title>
        </Head>
        <div
          style={{ backgroundColor: "#b1ede8", maxHeight: "max-content" }}
          className="flex p-10 flex-col xl:flex-row"
        >
          <section className={"bg-white p-10 m-auto " + styles.content}>
            <h1 className="text-5xl pb-2">
              <span className="highlight">{title}</span>
            </h1>
            <div
              className={markdownStyles["markdown"]}
              dangerouslySetInnerHTML={{
                __html: content,
              }}
            />
          </section>
          <div
            className={
              "flex flex-wrap flex-col xl:flex-row mr-auto justify-between content-between " +
              styles.siteLinksContainer
            }
          >
            <div className={"outline bg-white " + styles.siteLinksCard}>
              <BlogPosts />
            </div>
            <div
              className={"outline bg-white " + styles.siteLinksCard}
              style={{ minHeight: "45%", minWidth: "100%" }}
            >
              <div
                style={{
                  borderLeft: "4px solid black",
                  borderRight: "4px solid black",
                  overflow: "auto",
                }}
                className="flex justify-between p-2"
              >
                <h1 className="text-xl">What's the community saying?</h1>
                <Button
                  size="sm"
                  bg="brand.800"
                  color="white"
                  onClick={() => {
                    router.push("/questions/create");
                  }}
                >
                  Join
                </Button>
              </div>
              {questionsList ? (
                questionsList
              ) : (
                <Spinner size="md" className="m-auto" />
              )}
            </div>
          </div>
        </div>
        <Footer></Footer>
      </Layout>
    </>
  );
}

export async function getStaticProps({ params }) {
  const { category } = params;
  const topic = (await getTopicByCategory(category)) || [];
  const content = await markdownToHtml(topic?.topics[0]?.content || "");

  return {
    props: { topic, content },
  };
}
export async function getStaticPaths() {
  const allTopics = await getCategories();
  return {
    paths:
      allTopics.__type.enumValues?.map((topic) => `/topics/${topic.name}`) ||
      [],
    fallback: true,
  };
}
