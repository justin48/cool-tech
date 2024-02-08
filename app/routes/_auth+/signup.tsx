import {
  redirect,
  type MetaFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { SpamError } from "remix-utils/honeypot/server";
import { Button } from "#app/components/ui/button.tsx";
import { Input } from "#app/components/ui/input.tsx";
import { Label } from "#app/components/ui/label.tsx";
import { invariantResponse } from "#app/utils/misc.tsx";
import React from "react";
import { checkHoneypot, honeypot } from "#app/utils/honeypot.server.ts";

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  checkHoneypot(formData);

  return redirect("/");
}

export default function SignupRoute() {
  return (
    <div className="container flex min-h-full flex-col justify-center pb-32 pt-20">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-h1">Welcome Aboard!!</h1>
          <p className="text-body-md text-muted-foreground">
            Please enter your credentials.
          </p>
        </div>
        <Form
          method="POST"
          className="mx-auto flex min-w-[368px] max-w-sm flex-col gap-4"
        >
          <HoneypotInputs />
          <div>
            <Label htmlFor="email-input">Email</Label>
            <Input autoFocus id="email-input" name="email" type="email" />
          </div>
          <Button className="w-full" type="submit">
            Create an account
          </Button>
        </Form>
      </div>
    </div>
  );
}
