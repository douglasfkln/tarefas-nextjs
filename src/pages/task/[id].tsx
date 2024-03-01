import Head from "next/head";
import styles from './styles.module.css'
import { GetServerSideProps } from "next";

import { db } from '../../services/firebaseConnection'
import { doc, collection, query, where, getDoc, addDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { CONSTANTS } from "@/constants/constants";
import { TasksProps } from "../dashboard";
import { Textarea } from "@/components/Textarea";
import { useSession } from "next-auth/react";
import { ChangeEvent, FormEvent, useState } from "react";
import { FaTrash } from 'react-icons/fa'

interface TaskProps {
  item: TasksProps
  comments: CommentProps[]
}

interface CommentProps {
  id: string
  comment: string
  taskId: string
  user: string
  name: string
}

export default function Task({ item, comments }: TaskProps) {

  const { data: session } = useSession()
  const [input, setInput] = useState('')
  const [allComments, setAllComments] = useState<CommentProps[]>(comments)

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (input === '') return

    if (!session?.user?.email || !session?.user?.name) return

    try {
      const docRef = await addDoc(collection(db, CONSTANTS.DB.comments), {
        comment: input,
        created: new Date(),
        user: session?.user?.email,
        name: session?.user?.name,
        taskId: item?.id
      })
      const data = {
        id: docRef.id,
        comment: input,
        user: session?.user?.email,
        name: session?.user?.name,
        taskId: item?.id
      }
      setAllComments((oldItems) => [...oldItems, data])
      setInput('')
    } catch (error) {
      console.error(error)
    }
  }

  async function handleDeleteComment(id: string) {
    try {
      const docRef = doc(db, CONSTANTS.DB.comments, id)
      await deleteDoc(docRef)
      setAllComments((items) => items.filter((item) => item.id != id))
    } catch (error) {
      console.error(error)
    }
  }

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

        <form onSubmit={handleComment}>
          <Textarea
            value={input}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
            placeholder="Digite seu comentário"
          />
          <button disabled={!session?.user} className={styles.button}>Enviar comentário</button>
        </form>
      </section>

      <section className={styles.commentsContainer}>
        <h2>Todos comentários</h2>
        {allComments.length === 0 && (
          <span>Nenhum comentário foi encontrado</span>
        )}

        {allComments.map((item) => (
          <article key={item.id} className={styles.comment}>
            <div className={styles.headComment}>
              <label className={styles.commentLabel}>{item.name}</label>
              {item.user === session?.user?.email && (
                <button className={styles.buttonTrash} onClick={() => handleDeleteComment(item.id)}>
                  <FaTrash size={18} color="#EA3140" />
                </button>
              )}
            </div>
            <p>{item.comment}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {

  const id = params?.id as string

  const docRef = doc(db, CONSTANTS.DB.tasks, id)

  const q = query(collection(db, CONSTANTS.DB.comments), where("taskId", "==", id))
  const snapshotsComments = await getDocs(q)

  let allComments: CommentProps[] = []
  snapshotsComments.forEach((doc) => {
    allComments.push({
      id: doc.id,
      comment: doc.data().comment,
      taskId: doc.data().taskId,
      user: doc.data().user,
      name: doc.data().name,
    })
  })

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
      item: task,
      comments: allComments
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