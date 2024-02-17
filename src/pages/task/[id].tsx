import Head from "next/head";
import styles from './styles.module.css'
import { GetServerSideProps } from "next";

import { db } from '../../services/firebaseConnection'
import { doc, collection, query, where, getDoc } from 'firebase/firestore'
import { CONSTANTS } from "@/constants/constants";
import { TasksProps } from "../dashboard";
import { Textarea } from "@/components/Textarea";

interface TaskProps {
  item: TasksProps
}

export default function Task({ item }: TaskProps) {

  return (
    <div className={styles.container}>
      <Head>
        <title>Detalhes da Tarefa</title>
      </Head>

      <main className={styles.main}>
        <h1>Tarefa</h1>
        <article className={styles.task}>
          <p>
            {item.task}
          </p>
        </article>
      </main>

      <section className={styles.commentsContainer}>
        <h2>Deixe seu comentário</h2>

        <form >
          <Textarea
            placeholder="Digite seu comentário"
          />
          <button className={styles.button}>Enviar comentário</button>
        </form>
      </section>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {

  const id = params?.id as string

  const docRef = doc(db, CONSTANTS.DB.tasks, id)

  const snapshot = await getDoc(docRef)

  if (!snapshot.data()) {
    return redirectToHome()
  }

  if (!snapshot.data()?.public) {
    return redirectToHome()
  }

  const data = snapshot.data()
  const miliseconds = data?.created?.seconds * 1000

  const task = {
    id: id,
    task: data?.task,
    public: data?.public,
    created: new Date(miliseconds).toLocaleDateString(),
    user: data?.user
  }

  return {
    props: {
      item: task
    }
  }
}


const redirectToHome = () => {
  return {
    redirect: {
      destination: '/',
      permanent: false
    }
  }
}