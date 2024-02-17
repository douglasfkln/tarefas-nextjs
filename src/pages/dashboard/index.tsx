import { GetServerSideProps } from 'next'
import { ChangeEvent, FormEvent, useState, useEffect } from 'react'
import styles from './styles.module.css'
import Head from 'next/head'

import { getSession } from 'next-auth/react'
import { Textarea } from '@/components/Textarea'
import { FiShare2 } from 'react-icons/fi'
import { FaTrash } from 'react-icons/fa'

import { db } from '../../services/firebaseConnection'
import { addDoc, collection, query, orderBy, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'

import Link from 'next/link'
import { CONSTANTS } from '@/constants/constants'

interface DashboardProps {
  user: {
    email: string
  }
}

export interface TasksProps {
  id: string,
  created: Date,
  public: boolean,
  task: string,
  user: string
}

export default function Dashboard({ user }: DashboardProps) {

  const [input, setInput] = useState("")
  const [publicTask, setPublicTask] = useState(false)
  const [tasks, setTasks] = useState<TasksProps[]>([])

  useEffect(() => {
    async function loadTasks() {

      const tasksRef = collection(db, CONSTANTS.DB.tasks)
      const q = query(
        tasksRef,
        orderBy("created", "desc"),
        where("user", "==", user?.email)
      )

      onSnapshot(q, (snapshot) => {
        let list = [] as TasksProps[]
        snapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            task: doc.data().task,
            created: doc.data().created,
            public: doc.data().public,
            user: doc.data().user
          })
        })
        setTasks(list)
      })
    }

    loadTasks()
  }, [user?.email])

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>): void {
    setPublicTask(event.target.checked)
  }

  async function handleRegisterTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (input === '') return

    try {

      await addDoc(collection(db, CONSTANTS.DB.tasks), {
        task: input,
        created: new Date(),
        user: user.email,
        public: publicTask
      })

      setInput("")
      setPublicTask(false)

    } catch (error) {
      console.log(error)
    }
  }

  async function handleShare(id: string) {
    await navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL}/task/${id}`)
    alert("URL copiada com sucesso!")
  }

  async function handleDeleteTask(id: string) {
    const docRef = doc(db, CONSTANTS.DB.tasks, id)
    await deleteDoc(docRef)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Meu painel de tarefas</title>
      </Head>

      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
            <h1 className={styles.title}>Qual sua tarefa?</h1>

            <form onSubmit={handleRegisterTask}>
              <Textarea
                placeholder='Digite qual dua tarefa'
                value={input}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
              />

              <div className={styles.checkboxArea}>
                <input
                  id="checkbox"
                  type="checkbox"
                  className={styles.checkbox}
                  checked={publicTask}
                  onChange={handleChangePublic}
                />
                <label htmlFor="checkbox">Deixar tarefa pública</label>
              </div>

              <button type='submit' className={styles.button}>
                Registrar
              </button>
            </form>
          </div>
        </section>


        <section className={styles.taskContainer}>
          <h1>Minhas tarefas</h1>

          {tasks.map((task) => (
            <article key={task.id} className={styles.task}>
              {task.public && (
                <div className={styles.tagContainer}>
                  <label className={styles.tag}>Público</label>
                  <button className={styles.shareButton} onClick={() => handleShare(task.id)}>
                    <FiShare2
                      size={22}
                      color="#3183ff"
                    />
                  </button>
                </div>
              )}
              <div className={styles.taskContent}>
                {task.public ? (
                  <Link href={`/task/${task.id}`}>
                    <p>{task.task}</p>
                  </Link>
                ) : (
                  <p>{task.task}</p>
                )}
                <button className={styles.trashButton} onClick={() => handleDeleteTask(task.id)}>
                  <FaTrash
                    size={24}
                    color='#ea3140'
                  />
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {

  const session = await getSession({ req })

  if (!session?.user) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }
  return {
    props: {
      user: {
        email: session?.user?.email
      }
    }
  }
}