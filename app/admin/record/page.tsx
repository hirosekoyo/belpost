"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Scissors, Check } from "lucide-react"
import { useSalonStore, type HaircutType } from "@/lib/data"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

export default function RecordPage() {
  const { addHaircutRecord } = useSalonStore()
  const [selectedType, setSelectedType] = useState<HaircutType>("カット")

  const handleSubmit = () => {
    addHaircutRecord(selectedType)
    toast({
      title: "散髪記録を保存しました",
      description: `${selectedType}の記録を追加しました`,
      action: <ToastAction altText="OK">OK</ToastAction>,
    })
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <header className="flex items-center gap-2 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">散髪記録</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scissors className="h-5 w-5" />
            散髪情報を記録
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">カットタイプ</h3>
              <RadioGroup
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as HaircutType)}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="カット" id="cut" className="peer sr-only" />
                  <Label
                    htmlFor="cut"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Scissors className="mb-3 h-6 w-6" />
                    カット
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="前髪" id="bangs" className="peer sr-only" />
                  <Label
                    htmlFor="bangs"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Scissors className="mb-3 h-6 w-6" />
                    前髪
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="坊主" id="buzz" className="peer sr-only" />
                  <Label
                    htmlFor="buzz"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Scissors className="mb-3 h-6 w-6" />
                    坊主
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleSubmit} className="w-full">
              <Check className="mr-2 h-4 w-4" /> 散髪完了
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
